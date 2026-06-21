import 'package:flutter/material.dart';

void main() {
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
        scaffoldBackgroundColor: const Color(0xFF020817),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF10B981)),
      ),
      home: const MainShell(),
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

  final pages = const [
    HomePage(),
    NuevaCotizacionPage(),
    ForecastPage(),
    IARagPage(),
    PipelinePage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: pages[index]),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: (value) => setState(() => index = value),
        backgroundColor: const Color(0xFF0F172A),
        selectedItemColor: const Color(0xFF5EEAD4),
        unselectedItemColor: const Color(0xFFCBD5E1),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Inicio'),
          BottomNavigationBarItem(icon: Icon(Icons.add), label: 'Nuevo'),
          BottomNavigationBarItem(icon: Icon(Icons.trending_up), label: 'Forecast'),
          BottomNavigationBarItem(icon: Icon(Icons.auto_awesome), label: 'IA RAG'),
          BottomNavigationBarItem(icon: Icon(Icons.filter_alt_outlined), label: 'Pipeline'),
        ],
      ),
    );
  }
}

class AppHeader extends StatelessWidget {
  const AppHeader({super.key, required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 44,
          width: 44,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF10B981), Color(0xFF3B82F6)],
            ),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Center(
            child: Text('E', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              Text(subtitle, style: const TextStyle(color: Color(0xFF94A3B8))),
            ],
          ),
        ),
        IconButton(
          onPressed: () {},
          icon: const Icon(Icons.settings_outlined, color: Colors.white),
        )
      ],
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  Widget actionCard(IconData icon, String title, String subtitle, Color color) {
    return Container(
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
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: const Column(
              children: [
                Text('SESION ACTIVA', style: TextStyle(color: Color(0xFF5EEAD4), fontWeight: FontWeight.bold)),
                SizedBox(height: 14),
                Text(
                  'FALON MARTINA\nBERRÍOS VALENZUELA',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 27, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 12),
                Text(
                  'Gestiona cotizaciones, pipeline y forecast desde terreno.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 16),
                ),
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
              actionCard(Icons.add, 'Nueva Cotizacion', 'Crear oportunidad', const Color(0xFF10B981)),
              actionCard(Icons.filter_alt_outlined, 'Pipeline', 'Gestionar etapas', const Color(0xFF7C3AED)),
              actionCard(Icons.trending_up, 'Proyeccion', 'Forecast ponderado', const Color(0xFFF59E0B)),
              actionCard(Icons.settings_outlined, 'Configuracion', 'Cuenta y sesion', const Color(0xFF3B82F6)),
            ],
          ),
        ],
      ),
    );
  }
}

class NuevaCotizacionPage extends StatefulWidget {
  const NuevaCotizacionPage({super.key});

  @override
  State<NuevaCotizacionPage> createState() => _NuevaCotizacionPageState();
}

class _NuevaCotizacionPageState extends State<NuevaCotizacionPage> {
  double probabilidad = 55;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppHeader(title: 'Nueva cotizacion', subtitle: 'Carga comercial'),
          const SizedBox(height: 26),
          const Text('OPORTUNIDAD', style: TextStyle(color: Color(0xFF5EEAD4), fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          const Text(
            'Crear propuesta comercial',
            style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Los datos quedan disponibles para el dashboard y forecast.',
            style: TextStyle(color: Color(0xFFBFDBFE), fontSize: 17),
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Column(
              children: [
                formLabel('Cliente'),
                dropdown('Selecciona cliente'),
                formLabel('Producto'),
                dropdown('Selecciona producto'),
                formLabel('Monto cotizado'),
                input('\$'),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF042F2E),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF0F766E)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Probabilidad de exito', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 16)),
                      Text('${probabilidad.round()}%', style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                Slider(
                  value: probabilidad,
                  min: 0,
                  max: 100,
                  onChanged: (value) => setState(() => probabilidad = value),
                ),
                formLabel('Etapa'),
                dropdown('Prospeccion'),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.all(18),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Guardar cotizacion', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget formLabel(String text) => Padding(
        padding: const EdgeInsets.only(top: 16, bottom: 8),
        child: Text(text, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      );

  Widget dropdown(String text) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: const Color(0xFF020817), borderRadius: BorderRadius.circular(14)),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(text, style: const TextStyle(color: Colors.white)),
            const Icon(Icons.keyboard_arrow_down, color: Colors.white),
          ],
        ),
      );

  Widget input(String hint) => TextField(
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
          filled: true,
          fillColor: const Color(0xFF020817),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
}

class ForecastPage extends StatelessWidget {
  const ForecastPage({super.key});

  @override
  Widget build(BuildContext context) {
    return pagePlaceholder('FORECAST', 'Proyeccion', 'Cotizaciones recientes y forecast comercial.');
  }
}

class PipelinePage extends StatelessWidget {
  const PipelinePage({super.key});

  @override
  Widget build(BuildContext context) {
    return pagePlaceholder('PIPELINE', 'Pipeline', 'Seguimiento de etapas comerciales.');
  }
}

class IARagPage extends StatelessWidget {
  const IARagPage({super.key});

  @override
  Widget build(BuildContext context) {
    return pagePlaceholder('IA RAG', 'Asistente Encipharm', 'Espacio reservado para IA con documentos.');
  }
}

Widget pagePlaceholder(String tag, String title, String desc) {
  return Padding(
    padding: const EdgeInsets.all(22),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AppHeader(title: 'Enci', subtitle: 'Sales command'),
        const SizedBox(height: 28),
        Text(tag, style: const TextStyle(color: Color(0xFF5EEAD4), fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Text(desc, style: const TextStyle(color: Color(0xFFBFDBFE), fontSize: 17)),
      ],
    ),
  );
}