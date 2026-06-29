import 'package:flutter/material.dart';
import 'package:healix_app/core/services/media_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/widgets/responsive.dart';
import 'settings_widgets.dart';

class ReportIssue extends StatefulWidget {
  const ReportIssue({super.key});

  @override
  State<ReportIssue> createState() => _ReportIssueState();
}

class _ReportIssueState extends State<ReportIssue> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  String _issueType = 'Select issue type';
  bool _sendUpdates = true;
  bool _attachedScreenshot = false;

  void _openScreen(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  Future<void> _attachFromCamera() async {
    final result = await MediaService.pickFromCamera(actionName: 'issue screenshot');
    if (!mounted) return;
    if (!result.success) {
      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: const Color(0xFFFF4A22));
      return;
    }
    setState(() => _attachedScreenshot = true);
    AppActions.showSnack(context, 'Screenshot captured and attached', icon: Icons.camera_alt_outlined);
  }

  Future<void> _attachFromGallery() async {
    final result = await MediaService.pickFromGallery(actionName: 'issue screenshot');
    if (!mounted) return;
    if (!result.success) {
      AppActions.showSnack(context, result.message, icon: Icons.error_outline, color: const Color(0xFFFF4A22));
      return;
    }
    setState(() => _attachedScreenshot = true);
    AppActions.showSnack(context, 'Screenshot file attached', icon: Icons.upload_file_outlined);
  }

  void _submit() {
    if (_issueType == 'Select issue type') {
      AppActions.showSnack(context, 'Please select an issue type first', icon: Icons.error_outline, color: const Color(0xFFFF4A22));
      return;
    }
    if (_subjectController.text.trim().length < 4) {
      AppActions.showSnack(context, 'Please enter a subject.', icon: Icons.error_outline, color: const Color(0xFFFF4A22));
      return;
    }
    if (_descriptionController.text.trim().length < 10) {
      AppActions.showSnack(context, 'Please describe the issue in more detail.', icon: Icons.error_outline, color: const Color(0xFFFF4A22));
      return;
    }
    appState.addIssueReport(_issueType, _subjectController.text.trim(), _descriptionController.text.trim(), attachedScreenshot: _attachedScreenshot);
    AppActions.showInfo(context, title: 'Report submitted', message: 'Your $_issueType report has been saved locally and submitted. The support team will respond within 24 hours.${_sendUpdates ? ' Updates will be sent to ${appState.email}.' : ''}', icon: Icons.check_circle_outline, buttonText: 'Done');
    setState(() {
      _issueType = 'Select issue type';
      _subjectController.clear();
      _descriptionController.clear();
      _attachedScreenshot = false;
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _subjectController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Report an Issue',
      selectedItem: 'Report Issue',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SettingsHeader(title: 'Report an Issue', subtitle: 'Help us improve Healix', icon: Icons.flag_outlined, colors: [Color(0xFFFF3232), Color(0xFFFF6B00)]),
        Container(
          width: double.infinity,
          padding: AppResponsive.scalePadding(context, const EdgeInsets.all(18)),
          color: HealixColors.bg,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _IssueFormPanel(issueType: _issueType, subjectController: _subjectController, descriptionController: _descriptionController, onIssueTypeChanged: (value) => setState(() => _issueType = value)),
            const SizedBox(height: 18),
            _AttachmentPanel(attached: _attachedScreenshot, onTakePhoto: _attachFromCamera, onUploadFile: _attachFromGallery),
            const SizedBox(height: 18),
            _ContactPanel(sendUpdates: _sendUpdates, onChanged: (value) => setState(() => _sendUpdates = value)),
            const SizedBox(height: 18),
            SettingsPrimaryButton(label: 'Submit Report', onTap: _submit, color: const Color(0xFFFF4A22)),
            const SizedBox(height: 18),
            Center(child: Text('We typically respond within 24 hours', maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w800))),
          ]),
        ),
      ]),
    );
  }
}

class _IssueFormPanel extends StatelessWidget {
  const _IssueFormPanel({required this.issueType, required this.subjectController, required this.descriptionController, required this.onIssueTypeChanged});
  final String issueType;
  final TextEditingController subjectController;
  final TextEditingController descriptionController;
  final ValueChanged<String> onIssueTypeChanged;

  @override
  Widget build(BuildContext context) {
    const issueTypes = ['Select issue type', 'Bug', 'UI problem', 'Data issue', 'Feature request', 'Account problem'];
    return SettingsPanel(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Issue Type', style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w800)),
      const SizedBox(height: 8),
      DropdownButtonFormField<String>(
        value: issueType,
        isExpanded: true,
        items: issueTypes.map((item) => DropdownMenuItem(value: item, child: Text(item, overflow: TextOverflow.ellipsis))).toList(),
        onChanged: (value) => onIssueTypeChanged(value ?? issueType),
        style: TextStyle(color: HealixColors.navy, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w700),
        decoration: InputDecoration(filled: true, fillColor: Colors.white, contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFD8E4E8))), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFD8E4E8))), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: HealixColors.teal))),
      ),
      const SizedBox(height: 16),
      SettingsTextField(label: 'Subject', hintText: 'Brief description of the issue', controller: subjectController),
      const SizedBox(height: 16),
      SettingsTextField(label: 'Description', hintText: 'Please describe the issue in detail...', maxLines: 5, controller: descriptionController),
    ]));
  }
}

class _AttachmentPanel extends StatelessWidget {
  const _AttachmentPanel({required this.attached, required this.onTakePhoto, required this.onUploadFile});
  final bool attached;
  final Future<void> Function() onTakePhoto;
  final Future<void> Function() onUploadFile;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SettingsSectionTitle(attached ? 'Screenshot Attached' : 'Attach Screenshots'),
      const SizedBox(height: 18),
      Container(
        width: double.infinity,
        padding: AppResponsive.scalePadding(context, const EdgeInsets.symmetric(horizontal: 14, vertical: 28)),
        decoration: BoxDecoration(color: attached ? const Color(0xFFEFFBF4) : Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: attached ? const Color(0xFF20B95B) : const Color(0xFFD4DCE5), width: 1.4, strokeAlign: BorderSide.strokeAlignInside)),
        child: Column(children: [
          Icon(attached ? Icons.check_circle_outline : Icons.upload_outlined, color: attached ? const Color(0xFF20B95B) : const Color(0xFFA8B1BE), size: 48),
          const SizedBox(height: 14),
          Text(attached ? 'Screenshot ready to send' : 'Drag and drop or click to upload', textAlign: TextAlign.center, style: TextStyle(color: HealixColors.sub, fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w800)),
          const SizedBox(height: 14),
          ResponsiveWrapGrid(minTileWidth: 130, maxColumns: 2, spacing: 10, runSpacing: 10, children: [
            SettingsPrimaryButton(label: 'Take Photo', icon: Icons.camera_alt_outlined, filled: false, onTap: () { onTakePhoto(); }),
            SettingsPrimaryButton(label: 'Upload File', icon: Icons.upload_file_outlined, filled: false, onTap: () { onUploadFile(); }),
          ]),
        ]),
      ),
    ]));
  }
}

class _ContactPanel extends StatelessWidget {
  const _ContactPanel({required this.sendUpdates, required this.onChanged});
  final bool sendUpdates;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SettingsPanel(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const SettingsSectionTitle('Contact Information'),
      const SizedBox(height: 18),
      SettingsTextField(label: 'Email', initialValue: appState.email, keyboardType: TextInputType.emailAddress),
      const SizedBox(height: 14),
      InkWell(onTap: () => onChanged(!sendUpdates), borderRadius: BorderRadius.circular(10), child: Row(children: [
        Checkbox(value: sendUpdates, onChanged: (value) => onChanged(value ?? false), activeColor: HealixColors.navy),
        Expanded(child: Text('Send me updates about this issue', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: const Color(0xFF202534), fontSize: AppResponsive.font(context, 14), fontWeight: FontWeight.w700))),
      ])),
    ]));
  }
}
