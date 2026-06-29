import 'package:flutter/material.dart';
import 'package:healix_app/core/services/community_service.dart';
import 'package:healix_app/core/widgets/app_actions.dart';
import 'package:healix_app/core/widgets/feature_page_frame.dart';
import 'package:healix_app/core/theme_manage/app_theme.dart';
import '../../settings/screens/settings_widgets.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _newPostController = TextEditingController();
  
  List<dynamic> _challenges = [];
  List<dynamic> _posts = [];
  bool _isLoading = false;
  bool _isCreatingPost = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final postsFuture = CommunityService.getPosts();
      final challengesFuture = CommunityService.getChallenges();
      
      final results = await Future.wait([postsFuture, challengesFuture]);
      
      setState(() {
        _posts = results[0];
        _challenges = results[1];
      });
    } catch (_) {
      if (mounted) {
        AppActions.showSnack(context, 'Failed to load community feed', icon: Icons.error_outline, color: Colors.red.shade700);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitPost() async {
    final text = _newPostController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isCreatingPost = true);
    try {
      final success = await CommunityService.createPost({
        'content': text,
        'title': 'New Update',
      });
      if (success) {
        _newPostController.clear();
        if (mounted) {
          AppActions.showSnack(context, 'Post shared with community!', icon: Icons.send);
        }
        await _loadData();
      } else {
        if (mounted) {
          AppActions.showSnack(context, 'Failed to share post', icon: Icons.error_outline, color: Colors.red.shade700);
        }
      }
    } catch (e) {
      if (mounted) {
        AppActions.showSnack(context, 'Error sharing post: $e', icon: Icons.error_outline, color: Colors.red.shade700);
      }
    } finally {
      if (mounted) setState(() => _isCreatingPost = false);
    }
  }

  Future<void> _likePost(String id) async {
    try {
      final success = await CommunityService.likePost(id);
      if (success) {
        await _loadData();
      }
    } catch (_) {}
  }

  Future<void> _joinChallenge(String id) async {
    try {
      final success = await CommunityService.joinChallenge(id);
      if (success) {
        if (mounted) {
          AppActions.showSnack(context, 'Joined the challenge!', icon: Icons.check_circle);
        }
        await _loadData();
      }
    } catch (_) {}
  }

  void _openScreen(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  @override
  void dispose() {
    _searchController.dispose();
    _newPostController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FeaturePageFrame(
      title: 'Community Feed',
      selectedItem: 'Community Feed',
      searchController: _searchController,
      openScreen: _openScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SettingsHeader(
            title: 'Community Feed',
            subtitle: 'Share updates, view challenges, and connect with other users.',
            icon: Icons.people_outline,
            colors: [Color(0xFF0E5678), Color(0xFF0E5678)],
          ),
          SettingsSurface(
            children: [
              // Challenges Section
              if (_challenges.isNotEmpty) ...[
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4.0),
                  child: SettingsSectionTitle('Active Challenges', icon: Icons.local_fire_department, iconColor: Colors.orange),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 140,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _challenges.length,
                    itemBuilder: (context, index) {
                      final c = _challenges[index];
                      final joined = c['is_joined'] == true;
                      return Container(
                        width: 200,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: joined ? HealixColors.green : HealixColors.border),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 4))
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              c['title'] ?? 'Challenge',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: HealixColors.navy, fontSize: 14),
                            ),
                            const SizedBox(height: 4),
                            Expanded(
                              child: Text(
                                c['description'] ?? '',
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: HealixColors.sub, fontSize: 11, height: 1.3),
                              ),
                            ),
                            const SizedBox(height: 6),
                            SizedBox(
                              width: double.infinity,
                              height: 28,
                              child: OutlinedButton(
                                onPressed: joined ? null : () => _joinChallenge(c['id']?.toString() ?? ''),
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: joined ? HealixColors.green.withOpacity(0.1) : HealixColors.navy,
                                  foregroundColor: joined ? HealixColors.green : Colors.white,
                                  side: BorderSide(color: joined ? HealixColors.green : HealixColors.navy),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  padding: EdgeInsets.zero,
                                ),
                                child: Text(joined ? 'Joined' : 'Join', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                            )
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Create Post Panel
              SettingsPanel(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SettingsSectionTitle('Share an Update'),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _newPostController,
                      maxLines: 3,
                      style: const TextStyle(color: HealixColors.navy, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'What\'s on your mind? Share your health progress...',
                        filled: true,
                        fillColor: HealixColors.navy.withOpacity(0.04),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerRight,
                      child: SizedBox(
                        width: 120,
                        height: 36,
                        child: ElevatedButton.icon(
                          onPressed: _isCreatingPost ? null : _submitPost,
                          icon: _isCreatingPost
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.send, size: 14),
                          label: const Text('Post', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: HealixColors.navy,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Posts Feed
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4.0),
                child: SettingsSectionTitle('Feed Updates'),
              ),
              const SizedBox(height: 8),

              if (_isLoading && _posts.isEmpty)
                const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator()))
              else if (_posts.isEmpty)
                const SettingsPanel(
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: Text('No community posts yet. Be the first to share!', style: TextStyle(color: HealixColors.sub, fontWeight: FontWeight.bold)),
                    ),
                  ),
                )
              else
                ..._posts.map((post) {
                  final likes = post['likes_count'] ?? 0;
                  final author = post['username'] ?? 'User';
                  final initials = author.isNotEmpty ? author[0].toUpperCase() : 'U';
                  final isLiked = post['is_liked'] == true;
                  final content = post['content'] ?? '';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: SettingsPanel(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: HealixColors.navy.withOpacity(0.1),
                                child: Text(initials, style: const TextStyle(color: HealixColors.navy, fontWeight: FontWeight.bold, fontSize: 12)),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(author, style: const TextStyle(fontWeight: FontWeight.bold, color: HealixColors.navy, fontSize: 13)),
                                    const SizedBox(height: 2),
                                    const Text('Just now', style: TextStyle(color: HealixColors.sub, fontSize: 11)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            content,
                            style: const TextStyle(color: HealixColors.navy, fontSize: 13, height: 1.45),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              InkWell(
                                onTap: () => _likePost(post['id']?.toString() ?? ''),
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                                  child: Row(
                                    children: [
                                      Icon(
                                        isLiked ? Icons.favorite : Icons.favorite_border,
                                        color: isLiked ? Colors.red : HealixColors.sub,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 4),
                                      Text('$likes', style: TextStyle(color: isLiked ? Colors.red : HealixColors.sub, fontSize: 12, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ),
        ],
      ),
    );
  }
}
