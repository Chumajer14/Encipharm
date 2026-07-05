import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
//import '../widgets/app_header.dart';

const _sugerencias = [
  'Resume mis oportunidades activas.',
  '¿Qué clientes requieren seguimiento comercial?',
  '¿Qué información interna existe sobre bioseguridad?',
  '¿Cómo debo explicar el pipeline a un supervisor?',
];

class RagPage extends StatefulWidget {
  const RagPage({super.key, this.onSettingsTap});
  final VoidCallback? onSettingsTap;

  @override
  State<RagPage> createState() => _RagPageState();
}

class _RagPageState extends State<RagPage> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String? _conversacionId;
  bool _loading = false;
  final List<Map<String, dynamic>> _mensajes = [];

  void _resetConversacion() {
    setState(() {
      _mensajes.clear();
      _conversacionId = null;
      _controller.clear();
    });
  }

  Future<void> _enviar() async {
    final pregunta = _controller.text.trim();
    if (pregunta.isEmpty || _loading) return;

    setState(() {
      _mensajes.add({
        'tipo': 'pregunta',
        'texto': pregunta,
        'timestamp': DateTime.now(),
      });
      _loading = true;
    });
    _controller.clear();
    _scrollAbajo();

    try {
      final res = await ApiService.ragChat(
        pregunta,
        conversacionId: _conversacionId,
      );
      if (!mounted) return;
      setState(() {
        _conversacionId = res['conversacion_id'];
        _mensajes.add({
          'tipo': 'respuesta',
          'texto': res['respuesta'],
          'fuentes': res['fuentes'] ?? [],
          'timestamp': DateTime.now(),
        });
        _loading = false;
      });
      _scrollAbajo();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _mensajes.add({
          'tipo': 'respuesta',
          'texto': 'Error al conectar con el asistente. Intenta de nuevo.',
          'fuentes': [],
          'timestamp': DateTime.now(),
        });
        _loading = false;
      });
    }
  }

  void _scrollAbajo() {
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _formatHora(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(22, 22, 22, 0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('ASISTENTE ENCI',
                        style: TextStyle(
                            color: AppColors.green,
                            fontWeight: FontWeight.bold,
                            fontSize: 11)),
                    const SizedBox(height: 4),
                    const Text('IA RAG',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    const Text(
                      'Consulta información interna, CRM y documentos de apoyo desde terreno.',
                      style: TextStyle(color: AppColors.textSoft, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Row(
                  children: [
                    IconButton(
                      onPressed: widget.onSettingsTap,
                      icon: const Icon(Icons.settings_outlined, color: AppColors.textMuted),
                    ),
                    IconButton(
                      onPressed: _resetConversacion,
                      icon: const Icon(Icons.refresh, color: AppColors.textMuted),
                      tooltip: 'Nueva conversación',
                    ),
                  ],
                ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Área de mensajes
        Expanded(
          child: _mensajes.isEmpty
              ? _pantallaVacia()
              : ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _mensajes.length,
                  itemBuilder: (context, i) => _burbuja(_mensajes[i]),
                ),
        ),

        // Loading
        if (_loading)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 6),
            child: Row(
              children: [
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: AppColors.green),
                ),
                const SizedBox(width: 10),
                const Text('Procesando consulta...',
                    style:
                        TextStyle(color: AppColors.textMuted, fontSize: 12)),
              ],
            ),
          ),

        // Input
        Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          decoration: BoxDecoration(
            color: AppColors.card,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              TextField(
                controller: _controller,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                maxLines: 3,
                minLines: 1,
                maxLength: 1000,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(
                  hintText:
                      'Escribe una consulta sobre clientes, oportunidades, documentos o procesos...',
                  hintStyle:
                      const TextStyle(color: AppColors.textMuted, fontSize: 13),
                  filled: true,
                  fillColor: AppColors.background,
                  counterStyle:
                      const TextStyle(color: AppColors.textMuted, fontSize: 11),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _enviar,
                  icon: const Icon(Icons.send, size: 16),
                  label: const Text('Enviar',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.green,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppColors.border,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _pantallaVacia() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 22),
      child: Column(
        children: [
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.green.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.auto_awesome,
                      color: AppColors.green, size: 28),
                ),
                const SizedBox(height: 16),
                const Text('Pregunta libre',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'El asistente buscará contexto corporativo, comercial y documental para responder.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSoft, fontSize: 13),
                ),
                const SizedBox(height: 20),

                // Sugerencias
                ...(_sugerencias.map((s) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _controller.text = s);
                        },
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppColors.green.withValues(alpha: 0.3)),
                          ),
                          child: Text(s,
                              style: const TextStyle(
                                  color: AppColors.textSoft, fontSize: 13)),
                        ),
                      ),
                    ))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _burbuja(Map<String, dynamic> msg) {
    final esPregunta = msg['tipo'] == 'pregunta';
    final fuentes = msg['fuentes'] as List? ?? [];
    final hora = _formatHora(msg['timestamp'] as DateTime);
    final tieneFuentes = fuentes.isNotEmpty;
    final label = esPregunta
        ? 'Consulta'
        : tieneFuentes
            ? 'Respuesta'
            : 'Sin contexto';

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment:
            esPregunta ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // Label y hora
          Padding(
            padding: const EdgeInsets.only(bottom: 4, left: 4, right: 4),
            child: Row(
              mainAxisAlignment: esPregunta
                  ? MainAxisAlignment.end
                  : MainAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        color: esPregunta ? AppColors.green : AppColors.textMuted,
                        fontSize: 11,
                        fontWeight: FontWeight.bold)),
                const SizedBox(width: 6),
                Text(hora,
                    style: const TextStyle(
                        color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),

          // Burbuja
          Container(
            constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.82),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: esPregunta
                  ? AppColors.green.withValues(alpha: 0.15)
                  : AppColors.card,
              borderRadius: BorderRadius.circular(16).copyWith(
                bottomRight:
                    esPregunta ? const Radius.circular(4) : null,
                bottomLeft:
                    !esPregunta ? const Radius.circular(4) : null,
              ),
              border: Border.all(
                color: esPregunta
                    ? AppColors.green.withValues(alpha: 0.35)
                    : AppColors.border,
              ),
            ),
            child: Text(msg['texto'],
                style:
                    const TextStyle(color: Colors.white, fontSize: 14, height: 1.5)),
          ),

          // Fuentes
          if (tieneFuentes)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Fuentes:',
                      style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  ...fuentes.take(3).map((f) => Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('📄 ',
                                style: TextStyle(fontSize: 11)),
                            Expanded(
                              child: Text(
                                '${f['documento'] ?? 'Documento interno'}${f['pagina'] != null ? ' · pág. ${f['pagina']}' : ''}',
                                style: const TextStyle(
                                    color: AppColors.textMuted, fontSize: 11),
                              ),
                            ),
                          ],
                        ),
                      )),
                ],
              ),
            ),
        ],
      ),
    );
  }
}