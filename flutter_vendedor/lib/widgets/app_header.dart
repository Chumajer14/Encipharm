import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppHeader extends StatelessWidget {
  const AppHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.onSettingsTap,
  });

  final String title;
  final String subtitle;
  final VoidCallback? onSettingsTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                color: AppColors.textSoft,
                fontSize: 14,
              ),
            ),
          ],
        ),
        GestureDetector(
          onTap: onSettingsTap,
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: const Icon(
              Icons.settings_outlined,
              color: AppColors.textSoft,
              size: 20,
            ),
          ),
        ),
      ],
    );
  }
}