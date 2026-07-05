import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../theme/app_colors.dart';
import '../widgets/app_header.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.onNavigate});
  final Function(int index) onNavigate;

  Widget actionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: color.withOpacity(0.18),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white),
            const Spacer(),
            Text(title, style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 6),
            Text(subtitle, style: const TextStyle(
              color: AppColors.textMuted, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    final nombre = user?.displayName?.toUpperCase() ?? 'VENDEDOR';
    final email = user?.email ?? '';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppHeader(title: 'Enci', subtitle: 'Sales command'),
          const SizedBox(height: 24),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                const Text('SESION ACTIVA', style: TextStyle(
                  color: AppColors.teal, fontWeight: FontWeight.bold)),
                const SizedBox(height: 14),
                Text(nombre,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(email, style: const TextStyle(
                  color: AppColors.textMuted, fontSize: 13)),
                const SizedBox(height: 12),
                const Text(
                  'Gestiona cotizaciones, pipeline y forecast desde terreno.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSoft, fontSize: 16)),
              ],
            ),
          ),

          const SizedBox(height: 18),

          GridView.count(
            shrinkWrap: true,
            crossAxisCount: 2,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            physics: const NeverScrollableScrollPhysics(),
            children: [
                actionCard(
                    icon: Icons.add,
                    title: 'Nueva Cotizacion',
                    subtitle: 'Crear oportunidad',
                    color: AppColors.green,
                    onTap: () => onNavigate(1),
                  ),
                  actionCard(
                    icon: Icons.filter_alt_outlined,
                    title: 'Pipeline',
                    subtitle: 'Gestionar etapas',
                    color: AppColors.purple,
                    onTap: () => onNavigate(3), 
                  ),
                  actionCard(
                    icon: Icons.trending_up,
                    title: 'Proyeccion',
                    subtitle: 'Forecast ponderado',
                    color: AppColors.orange,
                    onTap: () => onNavigate(2), 
                  ),
                  actionCard(
                    icon: Icons.settings_outlined,
                    title: 'Configuracion',
                    subtitle: 'Cuenta y sesion',
                    color: AppColors.blue,
                    onTap: () => onNavigate(5),
                  ),
            ],
          ),
        ],
      ),
    );
  }
}