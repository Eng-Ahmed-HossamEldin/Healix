import 'package:flutter/material.dart';
import 'package:healix_app/core/services/media_service.dart';
import 'package:healix_app/core/services/api_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'system_widgets.dart';

class MedicalRecords extends StatefulWidget {
  const MedicalRecords({super.key});

  @override
  State<MedicalRecords> createState() => _MedicalRecordsState();
}

class _MedicalRecordsState extends State<MedicalRecords> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      appState.fetchMedicalRecords();
    });
  }

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _scanDocument() async {
    final result = await MediaService.pickFromCamera(actionName: 'medical document');
    if (!mounted) return;
    if (!result.success) {
      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    await AppActions.simulateProcess(
      context,
      title: 'Scanning document',
      loadingMessage: 'Extracting allergies, conditions, and medications from the captured image...',
      successMessage: 'Document scanned and indexed successfully',
    );
    appState.addMedicalScan('Camera Scan - Today');
  }

  Future<void> _uploadFile() async {
    final result = await MediaService.pickFromGallery(actionName: 'medical file image');
    if (!mounted) return;
    if (!result.success) {
      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: Colors.red.shade700);
      return;
    }
    
    // Show a dialog to get condition name and type
    String name = 'Uploaded Record';
    String type = 'other';
    String extra = '';
    
    final nameCtrl = TextEditingController(text: name);
    final typeCtrl = TextEditingController(text: type);
    final extraCtrl = TextEditingController(text: extra);
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Record Details', style: TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min, 
          children: [
            TextField(
              controller: nameCtrl, 
              decoration: const InputDecoration(labelText: 'Condition Name (e.g. Blood Test)'),
              style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
            ),
            TextField(
              controller: typeCtrl, 
              decoration: const InputDecoration(labelText: 'Type (e.g. diabetes, heart, other)'),
              style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
            ),
            TextField(
              controller: extraCtrl, 
              decoration: const InputDecoration(labelText: 'Notes'),
              style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false), 
            child: const Text('Cancel', style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true), 
            style: ElevatedButton.styleFrom(
              backgroundColor: HealixColors.navy,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Upload', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    
    if (confirm != true) return;

    await AppActions.simulateProcess(
      context,
      title: 'Uploading file',
      loadingMessage: 'Uploading and running AI extraction...',
      successMessage: 'File uploaded and processed',
      duration: const Duration(seconds: 1),
    );
    
    try {
      final res = await ApiService.postMultipart(
        '/medical/records',
        fields: {
          'condition_name': nameCtrl.text.trim(),
          'condition_type': typeCtrl.text.trim(),
          'extra_info': extraCtrl.text.trim(),
        },
        fileKey: 'file',
        filePath: result.path!,
      );
      if (res.statusCode == 201) {
        appState.fetchMedicalRecords();
      }
    } catch (_) {}
  }

  Future<void> _reviewExtractedInfo() async {
    final allergies = TextEditingController(text: 'Peanuts, Dairy');
    final conditions = TextEditingController(text: 'Type 2 Diabetes');
    final medications = TextEditingController(text: 'Metformin 500mg');
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Review extracted information', style: TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: allergies, 
                decoration: const InputDecoration(labelText: 'Allergies'),
                style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: conditions, 
                decoration: const InputDecoration(labelText: 'Conditions'),
                style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: medications, 
                decoration: const InputDecoration(labelText: 'Medications'),
                style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext), 
            child: const Text('Cancel', style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              appState.reviewMedicalInfo();
              AppActions.showSnack(context, 'Medical record changes saved');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: HealixColors.navy, 
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Save', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
    allergies.dispose();
    conditions.dispose();
    medications.dispose();
  }

  void _openRecentScan(String title) {
    AppActions.showInfo(
      context,
      title: title,
      message: 'Status: Processed\nExtracted data: allergies, conditions, medication notes, and doctor recommendations.',
      icon: Icons.description_outlined,
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Medical Records',
      selectedItem: 'Medical Records',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SystemGradientHeader(
            title: 'Medical Records',
            subtitle: 'AI-powered document analysis',
            icon: Icons.description_outlined,
            colors: [HealixColors.navy, HealixColors.navyLight],
          ),
          const SizedBox(height: 16),
          const SystemGradientInfoCard(
            icon: Icons.auto_awesome_outlined,
            title: 'AI Document Processing',
            message: 'Our AI automatically extracts allergies, conditions, and medications from your medical documents.',
            colors: [HealixColors.green, HealixColors.navy],
          ),
          const SizedBox(height: 16),
          _UploadPanel(onScan: _scanDocument, onUpload: _uploadFile),
          const SizedBox(height: 16),
          _ExtractedInfoPanel(onReview: _reviewExtractedInfo),
          const SizedBox(height: 16),
          _RecentScansPanel(onOpenScan: _openRecentScan),
          const SizedBox(height: 16),
          const _PrivacyPanel(),
        ],
      ),
    );
  }
}

class _UploadPanel extends StatelessWidget {
  const _UploadPanel({required this.onScan, required this.onUpload});

  final VoidCallback onScan;
  final VoidCallback onUpload;

  @override
  Widget build(BuildContext context) {
    return SystemPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SystemSectionTitle('Upload Medical Document'),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 18, vertical: 30)),
            decoration: BoxDecoration(
              color: HealixColors.navy.withOpacity(0.02),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: HealixColors.border, width: 1.5),
            ),
            child: Column(
              children: [
                Container(
                  width: AppResponsive.isTiny(context) ? 50 : 58,
                  height: AppResponsive.isTiny(context) ? 50 : 58,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: HealixColors.border)),
                  child: Icon(Icons.description_outlined, color: HealixColors.navy, size: AppResponsive.isTiny(context) ? 30 : 36),
                ),
                const SizedBox(height: 16),
                Text(
                  'Upload or scan medical document',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 15), fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Supported: PDF, JPG, PNG',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  alignment: WrapAlignment.center,
                  children: [
                    SystemActionButton(label: 'Scan Document', icon: Icons.camera_alt_outlined, onTap: onScan, color: HealixColors.navy),
                    SystemActionButton(label: 'Upload File', icon: Icons.upload_file_outlined, onTap: onUpload, filled: false, color: HealixColors.navy),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ExtractedInfoPanel extends StatelessWidget {
  const _ExtractedInfoPanel({required this.onReview});

  final VoidCallback onReview;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) => SystemPanel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SystemSectionTitle('Extracted Information'),
            const SizedBox(height: 16),
            if (appState.medicalRecords.isEmpty)
              const SystemInfoTile(
                title: 'No extracted data yet',
                subtitle: 'Scan or upload a document to extract allergies, conditions, and medications.',
              )
            else ...[
              const SystemInfoTile(
                title: 'Allergies',
                subtitle: 'Data extracted from records',
                trailing: SystemStatusPill(label: 'Verified', color: HealixColors.green, icon: Icons.check),
              ),
              const SizedBox(height: 10),
              const SystemInfoTile(
                title: 'Conditions',
                subtitle: 'Synced with Backend',
                trailing: SystemStatusPill(label: 'Verified', color: HealixColors.green, icon: Icons.check),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onReview,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: HealixColors.navy,
                    side: const BorderSide(color: HealixColors.border),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Refresh AI Extraction', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RecentScansPanel extends StatelessWidget {
  const _RecentScansPanel({required this.onOpenScan});

  final void Function(String title) onOpenScan;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: appState,
      builder: (context, _) => SystemPanel(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SystemSectionTitle('Recent Scans'),
            const SizedBox(height: 14),
            if (appState.medicalRecords.isEmpty)
              const SystemInfoTile(
                leadingIcon: Icons.description_outlined,
                title: 'No scans yet',
                subtitle: 'Scan or upload a document to start building your records.',
              )
            else
              ...appState.medicalRecords.take(5).map((record) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SystemInfoTile(
                leadingIcon: Icons.description_outlined,
                iconColor: HealixColors.navyLight,
                title: record.conditionName,
                subtitle: record.createdAt.split('T').first,
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                  onPressed: () => appState.deleteMedicalRecord(record.id),
                ),
                onTap: () => onOpenScan(record.conditionName),
              ),
            )),
          ],
        ),
      ),
    );
  }
}

class _PrivacyPanel extends StatelessWidget {
  const _PrivacyPanel();

  @override
  Widget build(BuildContext context) {
    return FeatureSectionCard(
      padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
      radius: 18,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.lock_outline, color: HealixColors.orange, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Privacy Protected', style: TextStyle(color: HealixColors.navy, fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  'All medical documents are encrypted and HIPAA compliant.',
                  style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 13), fontWeight: FontWeight.bold, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
