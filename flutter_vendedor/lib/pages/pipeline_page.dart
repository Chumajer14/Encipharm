import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../widgets/app_header.dart';

class PipelinePage extends StatefulWidget {
  const PipelinePage({super.key, this.onSettingsTap});
  final VoidCallback? onSettingsTap;

  @override
  State<PipelinePage> createState() => _PipelinePageState();
}

class _PipelinePageState extends State<PipelinePage> {
  List _oportunidades = [];
  bool _loading = true;
  String? _error;

  final etapas = [
    {'valor': 'nuevo', 'label': 'Prospección', 'color': 0xFF3B82F6},
    {'valor': 'contactado', 'label': 'Calificación', 'color': 0xFF8B5CF6},
    {'valor': 'cotizacion', 'label': 'Propuesta', 'color': 0xFFF59E0B},
    {'valor': 'negociacion', 'label': 'Negociación', 'color': 0xFFEC4899},
    {'valor': 'ganado', 'label': 'Ganado', 'color': 0xFF10B981},
    {'valor': 'perdido', 'label': 'Perdido', 'color': 0xFFEF4444},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final oportunidades = await ApiService.getOportunidades();
      if (!mounted) return;
      setState(() {
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

  Future<void> _cambiarEtapa(String id, String etapaActual) async {
    final nueva = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Cambiar etapa',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ...etapas.map((e) {
                final esActual = e['valor'] == etapaActual;
                final color = Color(e['color'] as int);
                return ListTile(
                  leading: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  title: Text(e['label'] as String,
                      style: TextStyle(
                          color: esActual ? color : Colors.white,
                          fontWeight: esActual
                              ? FontWeight.bold
                              : FontWeight.normal)),
                  trailing: esActual
                      ? Icon(Icons.check, color: color, size: 18)
                      : null,
                  onTap: () => Navigator.pop(context, e['valor'] as String),
                );
              }),
            ],
          ),
        );
      },
    );

    if (nueva == null || nueva == etapaActual) return;

    try {
      await ApiService.updateEtapa(id, nueva);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Etapa actualizada a ${_labelEtapa(nueva)}'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al actualizar etapa'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  List _filtrarPorEtapa(String etapa) {
    return _oportunidades.where((op) => op['etapa'] == etapa).toList();
  }

  Color _colorEtapa(String etapa) {
    final found = etapas.firstWhere(
      (e) => e['valor'] == etapa,
      orElse: () => {'color': 0xFF3B82F6},
    );
    return Color(found['color'] as int);
  }

  String _labelEtapa(String etapa) {
    final found = etapas.firstWhere(
      (e) => e['valor'] == etapa,
      orElse: () => {'label': etapa},
    );
    return found['label'] as String;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
          child: CircularProgressIndicator(color: AppColors.teal));
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
            const SizedBox(height: 12),
            const Text('Error al cargar pipeline',
                style: TextStyle(color: Colors.white, fontSize: 18)),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: _load, child: const Text('Reintentar')),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppHeader(
  title: 'Pipeline',
  subtitle: 'Seguimiento comercial',
  onSettingsTap: widget.onSettingsTap,
),
          const SizedBox(height: 24),

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _resumenItem('Total', '${_oportunidades.length}', AppColors.teal),
                _resumenItem('Ganadas',
                    '${_filtrarPorEtapa('ganado').length}', AppColors.green),
                _resumenItem('Perdidas',
                    '${_filtrarPorEtapa('perdido').length}', Colors.redAccent),
              ],
            ),
          ),

          const SizedBox(height: 28),

          ...etapas.map((etapa) {
            final ops = _filtrarPorEtapa(etapa['valor'] as String);
            if (ops.isEmpty) return const SizedBox.shrink();
            final color = Color(etapa['color'] as int);

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                          color: color, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${etapa['label']} (${ops.length})',
                      style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.bold,
                          fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ...ops.map((op) => _oportunidadCard(op)),
                const SizedBox(height: 20),
              ],
            );
          }),

          if (_oportunidades.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: const Text('No hay oportunidades en el pipeline.',
                  style: TextStyle(color: AppColors.textSoft)),
            ),
        ],
      ),
    );
  }

  Widget _oportunidadCard(dynamic op) {
    final valor = (op['valorEstimado'] ?? 0).toDouble();
    final prob = (op['probabilidad'] ?? 0).toInt();
    final etapa = op['etapa'] ?? '';
    final id = op['id'] ?? '';
    final color = _colorEtapa(etapa);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    (op['titulo'] ?? '?')[0].toUpperCase(),
                    style: TextStyle(
                        color: color, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(op['titulo'] ?? '',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('\$${valor.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}',
                  style: const TextStyle(
                      color: AppColors.teal,
                      fontWeight: FontWeight.bold)),
              Text('$prob%',
                  style: const TextStyle(color: AppColors.textMuted)),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _cambiarEtapa(id, etapa),
              icon: Icon(Icons.swap_horiz, color: color, size: 16),
              label: Text(
                'Etapa: ${_labelEtapa(etapa)}',
                style: TextStyle(color: color, fontSize: 13),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: color.withValues(alpha: 0.4)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _resumenItem(String label, String valor, Color color) {
    return Column(
      children: [
        Text(valor,
            style: TextStyle(
                color: color, fontSize: 28, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: AppColors.textMuted)),
      ],
    );
  }
}