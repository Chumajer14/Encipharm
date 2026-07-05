import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import '../widgets/app_header.dart';

class NuevaCotizacionPage extends StatefulWidget {
  const NuevaCotizacionPage({super.key, this.onSettingsTap});
  final VoidCallback? onSettingsTap;

  @override
  State<NuevaCotizacionPage> createState() => _NuevaCotizacionPageState();
}

class _NuevaCotizacionPageState extends State<NuevaCotizacionPage> {
  double probabilidad = 55;
  final montoController = TextEditingController();
  final tituloController = TextEditingController();

  String? clienteSeleccionadoId;
  String? clienteSeleccionadoNombre;
  String etapaSeleccionada = 'nuevo';
  bool _loading = false;
  bool _loadingClientes = true;
  List _clientes = [];

  final etapas = [
    {'valor': 'nuevo', 'label': 'Prospección'},
    {'valor': 'contactado', 'label': 'Calificación'},
    {'valor': 'cotizacion', 'label': 'Propuesta'},
    {'valor': 'negociacion', 'label': 'Negociación'},
    {'valor': 'ganado', 'label': 'Cierre'},
    {'valor': 'perdido', 'label': 'Perdido'},
  ];

  @override
  void initState() {
    super.initState();
    _cargarClientes();
  }

  Future<void> _cargarClientes() async {
    try {
      final clientes = await ApiService.getClientes();
      setState(() {
        _clientes = clientes;
        _loadingClientes = false;
      });
    } catch (e) {
      setState(() => _loadingClientes = false);
    }
  }

  Future<void> _guardar() async {
    if (clienteSeleccionadoId == null ||
        tituloController.text.isEmpty ||
        montoController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Completa todos los campos')),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      // 1. Crear oportunidad
      final oportunidad = await ApiService.createOportunidad({
        'clienteId': clienteSeleccionadoId,
        'titulo': tituloController.text.trim(),
        'etapa': etapaSeleccionada,
        'valorEstimado': double.tryParse(montoController.text) ?? 0,
        'probabilidad': probabilidad.round(),
      });

      // 2. Crear propuesta vinculada a la oportunidad
      await ApiService.createPropuesta({
        'clienteId': clienteSeleccionadoId,
        'oportunidadId': oportunidad['id'],
        'titulo': tituloController.text.trim(),
        'montoNeto': double.tryParse(montoController.text) ?? 0,
        'descuentoPct': 0,
        'estado': 'borrador',
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Cotización guardada en el dashboard'),
            backgroundColor: Colors.green,
          ),
        );
        // Limpiar formulario
        setState(() {
          clienteSeleccionadoId = null;
          clienteSeleccionadoNombre = null;
          tituloController.clear();
          montoController.clear();
          probabilidad = 55;
          etapaSeleccionada = 'nuevo';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppHeader(
  title: 'Nueva cotización',
  subtitle: 'Carga comercial',
  onSettingsTap: widget.onSettingsTap,
),
          const SizedBox(height: 24),
          const Text('OPORTUNIDAD', style: TextStyle(
              color: AppColors.teal, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          const Text('Crear propuesta comercial', style: TextStyle(
              color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          const Text('Los datos quedan disponibles para el dashboard y forecast.',
              style: TextStyle(color: AppColors.textSoft, fontSize: 16)),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _campoTitulo('Título de la oportunidad'),
                _inputTexto(tituloController, 'Ej: Venta productos Aleris Q3'),

                _campoTitulo('Cliente'),
                _loadingClientes
                    ? const Center(child: CircularProgressIndicator(
                        color: AppColors.teal))
                    : DropdownButtonFormField<String>(
                        dropdownColor: AppColors.card,
                        iconEnabledColor: Colors.white,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppColors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        hint: const Text('Selecciona cliente',
                            style: TextStyle(color: Colors.white)),
                        value: clienteSeleccionadoId,
                        items: _clientes.map<DropdownMenuItem<String>>((c) {
                          return DropdownMenuItem<String>(
                            value: c['id'].toString(),
                            child: Text(c['nombre'] ?? c['empresa'] ?? ''),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() => clienteSeleccionadoId = value);
                        },
                      ),

                _campoTitulo('Monto cotizado'),
                _inputMonto(),

                const SizedBox(height: 18),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF042F2E),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Probabilidad de éxito',
                          style: TextStyle(color: AppColors.textSoft)),
                      Text('${probabilidad.round()}%', style: const TextStyle(
                          color: AppColors.green,
                          fontWeight: FontWeight.bold,
                          fontSize: 18)),
                    ],
                  ),
                ),
                Slider(
                  value: probabilidad,
                  min: 0,
                  max: 100,
                  activeColor: AppColors.green,
                  onChanged: (value) => setState(() => probabilidad = value),
                ),

                _campoTitulo('Etapa'),
                DropdownButtonFormField<String>(
                  dropdownColor: AppColors.card,
                  iconEnabledColor: Colors.white,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  value: etapaSeleccionada,
                  items: etapas.map((e) {
                    return DropdownMenuItem<String>(
                      value: e['valor'],
                      child: Text(e['label']!),
                    );
                  }).toList(),
                  onChanged: (value) =>
                      setState(() => etapaSeleccionada = value ?? 'nuevo'),
                ),

                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _guardar,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.green,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _loading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Guardar Cotización',
                            style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _campoTitulo(String texto) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(texto, style: const TextStyle(
          color: Colors.white, fontWeight: FontWeight.bold)),
    );
  }

  Widget _inputTexto(TextEditingController controller, String hint) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textMuted),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  Widget _inputMonto() {
    return TextField(
      controller: montoController,
      keyboardType: TextInputType.number,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        hintText: '\$',
        hintStyle: const TextStyle(color: AppColors.textMuted),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}