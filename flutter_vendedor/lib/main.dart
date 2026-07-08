import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'firebase_options.dart';
import 'pages/nueva_cotizacion.dart';
import 'pages/home_page.dart';
import 'theme/app_colors.dart';
import 'pages/forecast_page.dart';
import 'pages/login_page.dart';
import 'pages/config_page.dart';
import 'pages/pipeline_page.dart';
import 'pages/rag_page.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const EnciApp());
}

class EnciApp extends StatelessWidget {
  const EnciApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Enci Vendedor',
      theme: ThemeData(
        fontFamily: 'Arial',
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: ColorScheme.fromSeed(seedColor: AppColors.green),
      ),
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool loggedIn = false;

  @override
  Widget build(BuildContext context) {
    if (loggedIn) {
      return const MainShell();
    }
    return LoginPage(
      onLoginSuccess: () {
        setState(() {
          loggedIn = true;
        });
      },
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int index = 0;
  bool? _tieneAcceso;

  @override
  void initState() {
    super.initState();
    _verificar();
  }

  Future<void> _verificar() async {
    final acceso = await ApiService.verificarAcceso();
    if (!mounted) return;
    setState(() => _tieneAcceso = acceso);
  }

  void _logout() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const AuthGate()),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Cargando verificacion
    if (_tieneAcceso == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF0F172A),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF0D9488)),
        ),
      );
    }

    // Sin acceso
    if (!_tieneAcceso!) {
      return Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline,
                    color: Colors.orangeAccent, size: 80),
                const SizedBox(height: 24),
                const Text(
                  'Sin acceso',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Tu cuenta no tiene permisos para acceder al sistema Enci Ventas.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 15),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: const Text(
                    '📧 Contacta al administrador de ENCI para que te asigne un rol en el sistema.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await GoogleSignIn().signOut();
                      await FirebaseAuth.instance.signOut();
                      _logout();
                    },
                    icon: const Icon(Icons.logout, color: Colors.redAccent),
                    label: const Text('Cerrar sesión',
                        style: TextStyle(color: Colors.redAccent)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.redAccent),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Con acceso — app normal
    final pages = [
      HomePage(onNavigate: (value) => setState(() => index = value)),
      NuevaCotizacionPage(onSettingsTap: () => setState(() => index = 5)),
      ForecastPage(onSettingsTap: () => setState(() => index = 5)),
      PipelinePage(onSettingsTap: () => setState(() => index = 5)),
      RagPage(onSettingsTap: () => setState(() => index = 5)),
      ConfigPage(onLogout: () {
        setState(() => index = 0);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const AuthGate()),
        );
      }),
    ];

    return Scaffold(
      body: SafeArea(child: pages[index]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: (value) => setState(() => index = value),
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: AppColors.teal,
        unselectedItemColor: AppColors.textSoft,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.add), label: 'Nuevo'),
          BottomNavigationBarItem(icon: Icon(Icons.trending_up), label: 'Forecast'),
          BottomNavigationBarItem(icon: Icon(Icons.filter_alt_outlined), label: 'Pipeline'),
          BottomNavigationBarItem(icon: Icon(Icons.auto_awesome), label: 'IA RAG'),
          BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: 'Config'),
        ],
      ),
    );
  }
}

Widget pagePlaceholder(String tag, String title, String desc) {
  return Padding(
    padding: const EdgeInsets.all(22),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(tag, style: const TextStyle(color: AppColors.teal, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Text(desc, style: const TextStyle(color: Color(0xFFBFDBFE), fontSize: 17)),
      ],
    ),
  );
}