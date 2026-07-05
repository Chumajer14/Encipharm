import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  static const String baseUrl = 'https://encipharm.onrender.com';

  static Future<Dio> _client() async {
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();
    return Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ));
  }

  static Future<Map<String, dynamic>> getDashboard() async {
    final dio = await _client();
    final res = await dio.get('/dashboard/vendedor');
    return res.data;
  }

  static Future<List> getPropuestas() async {
    final dio = await _client();
    final res = await dio.get('/propuestas');
    return res.data;
  }

  static Future<void> createPropuesta(Map<String, dynamic> data) async {
    final dio = await _client();
    await dio.post('/propuestas', data: data);
  }

  static Future<List> getOportunidades() async {
    final dio = await _client();
    final res = await dio.get('/oportunidades');
    return res.data;
  }

  static Future<Map<String, dynamic>> createOportunidad(Map<String, dynamic> data) async {
    final dio = await _client();
    final res = await dio.post('/oportunidades', data: data);
    return res.data;
  }

  static Future<void> updateEtapa(String id, String etapa) async {
    final dio = await _client();
    await dio.patch('/oportunidades/$id', data: {'etapa': etapa});
  }

  static Future<List> getClientes() async {
    final dio = await _client();
    final res = await dio.get('/clientes');
    return res.data;
  }

  static Future<Map<String, dynamic>> ragChat(String pregunta, {String? conversacionId}) async {
    final dio = await _client();
    final res = await dio.post('/rag/chat', data: {
      'pregunta': pregunta,
      if (conversacionId != null) 'conversacion_id': conversacionId,
    });
    return res.data;
  }
}