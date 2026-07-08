import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../widgets/app_header.dart';

class ForecastPage extends StatefulWidget {
  const ForecastPage({super.key, this.onSettingsTap});
  final VoidCallback? onSettingsTap;

  @override
  State<ForecastPage> createState() => _ForecastPageState();
}

class _ForecastPageState extends State<ForecastPage> {
  Map<String, dynamic>? _dashboard;
  List _oportunidades = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
  try {
    final dashboard = await ApiService.getDashboard();
    final oportunidades = await ApiService.getOportunidades();
    if (!mounted) return;
    setState(() {
      _dashboard = dashboard;
      _oportunidades = oportunidades;
      _loading = false;
    });
  } catch (e) {
    if (!mounted) return;
    setState(() {
      _error = e.toString();
      _loading = false;
    });
  }
}

  String _formatMonto(double value) {
  final entero = value.round();
  final formateado = entero.toString().replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]}.',
  );
  return '\$$formateado';
}

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.teal));
    }

    if (_error != null) {
  final sinAcceso = _error!.contains('SIN_ACCESO');
  return Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            sinAcceso ? Icons.lock_outline : Icons.wifi_off,
            color: sinAcceso ? Colors.orangeAccent : Colors.redAccent,
            size: 64,
          ),
          const SizedBox(height: 20),
          Text(
            sinAcceso ? 'Sin acceso' : 'Error de conexión',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            sinAcceso
                ? 'Tu cuenta no tiene permisos para ver esta información. Contacta al administrador del sistema para solicitar acceso.'
                : 'El servidor está iniciando. Intenta de nuevo en 30 segundos.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 28),
          if (!sinAcceso)
            ElevatedButton(
              onPressed: _load,
              child: const Text('Reintentar'),
            ),
          if (sinAcceso)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: const Text(
                '📧 Contacta a tu administrador ENCI para que te asigne un rol en el sistema.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSoft, fontSize: 13),
              ),
            ),
        ],
      ),
    ),
  );
}

    final pipeline = (_dashboard?['valorPipeline'] ?? 0).toDouble();
    final proyeccion = (_dashboard?['proyeccionPonderada'] ?? 0).toDouble();
    final totalOp = _dashboard?['totalOportunidades'] ?? 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
         AppHeader(
            title: 'Forecast',
            subtitle: 'Proyección comercial',
            onSettingsTap: widget.onSettingsTap,
          ),
          const SizedBox(height: 24),

          Row(children: [
            Expanded(child: _metricCard('Pipeline bruto', pipeline, AppColors.blue)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard('Proyección', proyeccion, AppColors.green)),
          ]),
          const SizedBox(height: 12),
          _metricCardInt('Oportunidades activas', totalOp, AppColors.orange),

          const SizedBox(height: 28),

          const Text('Oportunidades', style: TextStyle(
              color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 14),

          if (_oportunidades.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: const Text('No hay oportunidades registradas.',
                  style: TextStyle(color: AppColors.textSoft)),
            ),

          ..._oportunidades.map((op) {
            final valor = (op['valorEstimado'] ?? 0).toDouble();
            final prob = (op['probabilidad'] ?? 0).toInt();
            final ponderado = valor * prob / 100;

            return Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(op['titulo'] ?? '', style: const TextStyle(
                      color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(op['etapa'] ?? '', style: const TextStyle(
                      color: AppColors.teal, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _infoText('Valor', _formatMonto(valor)),
                      _infoText('Prob.', '$prob%'),
                      _infoText('Ponderado', _formatMonto(ponderado)),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _metricCard(String title, double value, Color color) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: AppColors.textSoft)),
          const SizedBox(height: 10),
          Text(_formatMonto(value), style: const TextStyle(
              color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _metricCardInt(String title, int value, Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: AppColors.textSoft)),
          const SizedBox(height: 10),
          Text('$value', style: const TextStyle(
              color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _infoText(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted)),
        Text(value, style: const TextStyle(
            color: Colors.white, fontWeight: FontWeight.bold)),
      ],
    );
  }
}