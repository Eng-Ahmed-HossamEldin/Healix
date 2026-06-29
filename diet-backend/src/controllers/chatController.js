const { GoogleGenAI } = require("@google/genai");
const userModel = require("../models/userModel");
const medicalModel = require("../models/medicalModel");
const doctorModel = require("../models/doctorModel");
const planModel = require("../models/planModel");

const handleChat = async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const user_username = req.user.username; // or req.user.user_username, need to verify
    
    // Get user data
    const userProfile = await userModel.getUserProfileByUsername(user_username);
    const medicalHistory = await medicalModel.getMedicalHistoryByUsername(user_username);

    // Format context for AI
    const allergyContext = medicalHistory.length > 0 
      ? medicalHistory.map(h => `- ${h.condition_name} (Severity: ${h.severity}, Notes: ${h.notes})`).join("\n") 
      : "None reported.";

    const systemInstruction = `You are an intelligent dietary and medical chat assistant within the diet planning app.
Current User: ${userProfile ? userProfile.first_name + ' ' + userProfile.last_name : user_username}
Address: ${userProfile ? userProfile.address : 'Not provided'}
Medical Conditions & Allergies:
${allergyContext}

You can help the user by:
1. Recommending doctors near them (using the recommend_doctors_near_address tool)
2. Forwarding them directly to a doctor (using forward_to_doctor tool)
3. Creating diet plans and meals for them (using create_diet_plan_with_meals tool)

Always tailor your diet recommendations safely taking into account their allergies. Try to support substitutions if they ask.
If the severity of the request is high (e.g. medical emergency), recommend doctors.
You receive both text and optionally image or audio for context.`;

    const chatText = req.body.message || "Hi";
    const contents = [];
    
    // Parse the textual prompt
    contents.push(chatText);

    // Add optional multimodal data
    if (req.file) {
      const fs = require("fs");
      // Create inline data part by reading from the saved file on disk
      contents.push({
        inlineData: {
          data: fs.readFileSync(req.file.path).toString("base64"),
          mimeType: req.file.mimetype
        }
      });
    }

    const tools = [{
      functionDeclarations: [
        {
          name: "recommend_doctors_near_address",
          description: "Search for doctors near a given address or keyword location.",
          parameters: {
            type: "object",
            properties: {
              location_keyword: { type: "string" }
            },
            required: ["location_keyword"]
          }
        },
        {
          name: "forward_to_doctor",
          description: "Link the user to a doctor to speak with them directly in the program.",
          parameters: {
            type: "object",
            properties: {
              doctor_username: { type: "string" }
            },
            required: ["doctor_username"]
          }
        },
        {
          name: "create_diet_plan_with_meals",
          description: "Create a diet plan and related meals for the user.",
          parameters: {
            type: "object",
            properties: {
              goal_type: { type: "string", description: "E.g., weight loss, muscle gain" },
              target_calories: { type: "number" },
              notes: { type: "string" },
              meals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    meal_name: { type: "string" },
                    meal_time: { type: "string", description: "HH:MM:SS format" },
                    day_no: { type: "number" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          food_id: { type: "number" },
                          qty: { type: "number" },
                          unit: { type: "string" },
                          instruction: { type: "string" }
                        },
                        required: ["food_id", "qty"]
                      }
                    }
                  },
                  required: ["meal_name"]
                }
              }
            },
            required: ["goal_type"]
          }
        }
      ]
    }];

    // Generate response using gemini-2.5-flash
    let responseText = "";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
        temperature: 0.7
      }
    });

    // Check for function calls
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === "recommend_doctors_near_address") {
          const docs = await doctorModel.searchDoctorsByAddress(call.args.location_keyword);
          responseText += `\nFound doctors near ${call.args.location_keyword}: ` + JSON.stringify(docs);
        } else if (call.name === "forward_to_doctor") {
          await doctorModel.linkUserDoctor(user_username, call.args.doctor_username);
          responseText += `\nSuccessfully forwarded you to Dr. ${call.args.doctor_username}.`;
        } else if (call.name === "create_diet_plan_with_meals") {
          const planId = await planModel.createPlanForUser(user_username, null, call.args);
          if (call.args.meals) {
            for (const meal of call.args.meals) {
              const mealId = await planModel.createMealForPlan(planId, meal);
              if (meal.items) {
                for (const item of meal.items) {
                  await planModel.createMealItem(mealId, item);
                }
              }
            }
          }
          responseText += `\nSuccessfully created your diet plan with ID: ${planId}.`;
        }
      }
      
      // Optionally run another generation to summarize the tool response
      // For simplicity, we just return the tool execution confirmation + initial logic
    }

    if (response.text) {
      responseText = response.text + "\n" + responseText;
    }

    res.json({ success: true, message: responseText.trim() });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ success: false, error: "Failed to process chat request." });
  }
};

module.exports = {
  handleChat
};
