import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:healix_app/core/services/api_service.dart';
import 'package:healix_app/core/state/app_state.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import 'package:healix_app/core/widgets/app_actions.dart';

/// Shown when the user's Doctor subscription is approved but they have not yet
/// chosen a doctor.  Mirrors the web coach.js "Choose Your Doctor" flow.
class DoctorSelectionScreen extends StatefulWidget {
  const DoctorSelectionScreen({super.key});

  @override
  State<DoctorSelectionScreen> createState() => _DoctorSelectionScreenState();
}

class _DoctorSelectionScreenState extends State<DoctorSelectionScreen> {
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _allDoctors = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _isLoading = true;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
    _searchController.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _searchController.removeListener(_applyFilter);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctors() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.get('/doctors/list');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        final list = (data as List<dynamic>).cast<Map<String, dynamic>>();
        setState(() {
          _allDoctors = list;
          _applyFilter();
        });
      } else {
        if (mounted) {
          AppActions.showSnack(context, 'Failed to load doctors',
              color: Colors.red.shade700, icon: Icons.error_outline);
        }
      }
    } catch (_) {
      if (mounted) {
        AppActions.showSnack(context, 'Network error loading doctors',
            color: Colors.red.shade700, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilter() {
    final q = _searchController.text.trim().toLowerCase();
    setState(() {
      if (q.isEmpty) {
        _filtered = List.from(_allDoctors);
      } else {
        _filtered = _allDoctors.where((d) {
          final name =
              '${d['first_name'] ?? ''} ${d['last_name'] ?? ''}'.toLowerCase();
          final cert = (d['certification'] ?? '').toString().toLowerCase();
          return name.contains(q) || cert.contains(q);
        }).toList();
      }
    });
  }

  Future<void> _requestDoctor(
      String doctorUsername, String doctorLabel) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Send Consultation Request'),
        content: Text(
            'Send a request to $doctorLabel? The doctor will review your profile.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purple.shade600,
              foregroundColor: Colors.white,
              minimumSize: Size.zero,
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Send Request'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _isSending = true);
    try {
      final res = await ApiService.post('/users/request-doctor',
          body: {'doctor_username': doctorUsername});
      if (!mounted) return;
      if (res.statusCode == 200 || res.statusCode == 201) {
        AppActions.showSnack(
            context, 'Consultation request sent to $doctorLabel! ✅',
            icon: Icons.check_circle_outline);
        // Refresh appState so human_coach rebuilds with new status
        await _refreshAppState();
        if (mounted) Navigator.pop(context);
      } else {
        final msg =
            jsonDecode(res.body)['message']?.toString() ?? 'Request failed';
        AppActions.showSnack(context, msg,
            color: Colors.red.shade700, icon: Icons.error_outline);
      }
    } catch (_) {
      if (mounted) {
        AppActions.showSnack(context, 'Network error',
            color: Colors.red.shade700, icon: Icons.error_outline);
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _refreshAppState() async {
    try {
      final res = await ApiService.get('/users/me');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['data'];
        appState.assignedDoctorUsername = data['assigned_doctor_username'];
        appState.doctorRequestStatus = data['doctor_request_status'];
        appState.notifyListeners();
      }
    } catch (_) {}
  }

  String _initials(Map<String, dynamic> d) {
    final f = (d['first_name'] ?? '').toString();
    final l = (d['last_name'] ?? '').toString();
    return ((f.isNotEmpty ? f[0] : '') + (l.isNotEmpty ? l[0] : ''))
            .toUpperCase()
            .isEmpty
        ? 'DR'
        : ((f.isNotEmpty ? f[0] : '') + (l.isNotEmpty ? l[0] : ''))
            .toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HealixColors.bg,
      appBar: AppBar(
        backgroundColor: HealixColors.navy,
        foregroundColor: Colors.white,
        title: const Text('Choose Your Doctor',
            style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: Column(
        children: [
          // ── Header banner ──────────────────────────────────────────
          Container(
            width: double.infinity,
            padding:
                const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [HealixColors.navy, HealixColors.navyDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle,
                          color: HealixColors.green, size: 14),
                      SizedBox(width: 6),
                      Text('Doctor Plan Active',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Select a doctor below to send a consultation request. They will review your profile before accepting.',
                  style: TextStyle(
                      color: Colors.white70, fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),

          // ── Search bar ─────────────────────────────────────────────
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by name or specialty…',
                prefixIcon: const Icon(Icons.search, color: HealixColors.sub),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: HealixColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(
                      color: HealixColors.navyLight, width: 1.5),
                ),
              ),
            ),
          ),

          // ── Doctor list ────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: HealixColors.navy))
                : _filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.person_search,
                                size: 60,
                                color: HealixColors.sub.withOpacity(0.5)),
                            const SizedBox(height: 12),
                            Text(
                              _allDoctors.isEmpty
                                  ? 'No doctors available at the moment.'
                                  : 'No doctors match your search.',
                              style: const TextStyle(
                                  color: HealixColors.sub, fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : Stack(
                        children: [
                          ListView.separated(
                            padding: const EdgeInsets.fromLTRB(
                                16, 0, 16, 24),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final d = _filtered[index];
                              final username =
                                  d['doctor_username']?.toString() ??
                                      d['username']?.toString() ??
                                      '';
                              final firstName =
                                  d['first_name']?.toString() ?? '';
                              final lastName =
                                  d['last_name']?.toString() ?? '';
                              final fullName =
                                  'Dr. $firstName $lastName'.trim();
                              final cert =
                                  d['certification']?.toString() ?? '';

                              return _DoctorCard(
                                initials: _initials(d),
                                fullName: fullName,
                                certification: cert,
                                isSending: _isSending,
                                onSelect: () => _requestDoctor(
                                    username, fullName),
                              );
                            },
                          ),
                          if (_isSending)
                            const Center(
                                child: CircularProgressIndicator(
                                    color: HealixColors.navy)),
                        ],
                      ),
          ),
        ],
      ),
    );
  }
}

// ── Doctor Card ────────────────────────────────────────────────────────────────

class _DoctorCard extends StatelessWidget {
  const _DoctorCard({
    required this.initials,
    required this.fullName,
    required this.certification,
    required this.isSending,
    required this.onSelect,
  });

  final String initials;
  final String fullName;
  final String certification;
  final bool isSending;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HealixColors.border),
        boxShadow: [
          BoxShadow(
            color: HealixColors.navy.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF7B2FBE), Color(0xFF5A189A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.purple.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Center(
              child: Text(
                initials,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fullName,
                  style: const TextStyle(
                    color: HealixColors.navy,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                if (certification.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    certification,
                    style: const TextStyle(
                      color: Color(0xFF7B2FBE),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Button
          ElevatedButton(
            onPressed: isSending ? null : onSelect,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7B2FBE),
              foregroundColor: Colors.white,
              minimumSize: Size.zero,
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: const Text('Select',
                style:
                    TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
