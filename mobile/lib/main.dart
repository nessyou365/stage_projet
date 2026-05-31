import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:file_picker/file_picker.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:syncfusion_flutter_pdf/pdf.dart';

const webFirebaseProjectId = 'ai-recruitment-7cb75';
const webFirebaseApiKey = 'AIzaSyA1xmapjAqTUYF-7KUjXQAzpSxeJj-Z91I';
const geminiApiKey = 'AIzaSyD5Txc_KdbsR6bV9evMQLXfQS0MQ408Gcw';
const geminiModels = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite'
];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: 'AIzaSyAa-8VluriE4S9PL5R6-rRT9dAIBV7LGkI',
      appId: '1:632954257476:web:3922fea55dd466b41e3c11',
      messagingSenderId: '632954257476',
      projectId: 'ai-recruitment-system-44349',
      storageBucket: 'ai-recruitment-system-44349.appspot.com',
    ),
  );
  runApp(const TalentAIMobileApp());
}

class TalentAIMobileApp extends StatelessWidget {
  const TalentAIMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'HireQ',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
        scaffoldBackgroundColor: const Color(0xFFF5F7FF),
        useMaterial3: true,
      ),
      home: const CandidateGate(),
    );
  }
}

class CandidateProfile {
  const CandidateProfile({
    required this.id,
    required this.name,
    required this.email,
    this.photoUrl = '',
  });

  final String id;
  final String name;
  final String email;
  final String photoUrl;
}

class PickedPdf {
  const PickedPdf({
    required this.bytes,
    required this.name,
  });

  final Uint8List bytes;
  final String name;
}

Future<String> uploadPdfToCloudinary({
  required String folder,
  required String candidateId,
  required PickedPdf pdf,
}) async {
  final safeName = pdf.name.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('https://api.cloudinary.com/v1_1/diaeq8qup/raw/upload'),
  );

  request.fields['upload_preset'] = 'cv_uploads2026';
  request.files.add(
    http.MultipartFile.fromBytes(
      'file',
      pdf.bytes,
      filename: safeName,
    ),
  );

  final response = await request.send();
  final body = await response.stream.bytesToString();
  final data = jsonDecode(body) as Map<String, dynamic>;

  if (response.statusCode < 200 ||
      response.statusCode >= 300 ||
      data['secure_url'] == null) {
    final message =
        (data['error'] as Map<String, dynamic>?)?['message']?.toString() ??
            'Upload CV impossible.';
    throw Exception(message);
  }

  return data['secure_url'].toString();
}

Future<String> uploadImageToCloudinary({
  required String candidateId,
  required Uint8List bytes,
  required String fileName,
}) async {
  final safeName = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('https://api.cloudinary.com/v1_1/diaeq8qup/image/upload'),
  );

  request.fields['upload_preset'] = 'cv_uploads2026';
  request.fields['folder'] = 'profile_photos/$candidateId';
  request.files.add(
    http.MultipartFile.fromBytes(
      'file',
      bytes,
      filename: safeName,
    ),
  );

  final response = await request.send();
  final body = await response.stream.bytesToString();
  final data = jsonDecode(body) as Map<String, dynamic>;

  if (response.statusCode < 200 ||
      response.statusCode >= 300 ||
      data['secure_url'] == null) {
    final message =
        (data['error'] as Map<String, dynamic>?)?['message']?.toString() ??
            'Upload image impossible.';
    throw Exception(message);
  }

  return data['secure_url'].toString();
}

class AiAnalysisResult {
  const AiAnalysisResult({
    required this.aiScore,
    required this.matchingScore,
    required this.extractedSkills,
    required this.aiSummary,
    required this.cvTextPreview,
    required this.skillGaps,
    required this.matchedRequirements,
    required this.strengths,
    required this.risks,
    required this.interviewQuestions,
    required this.recommendation,
    required this.provider,
  });

  final int aiScore;
  final int matchingScore;
  final List<String> extractedSkills;
  final String aiSummary;
  final String cvTextPreview;
  final List<String> skillGaps;
  final List<String> matchedRequirements;
  final List<String> strengths;
  final List<String> risks;
  final List<String> interviewQuestions;
  final String recommendation;
  final String provider;
}

class JobOffer {
  const JobOffer({
    required this.id,
    required this.title,
    required this.department,
    required this.location,
    required this.type,
    required this.description,
    required this.skills,
    required this.applicants,
  });

  final String id;
  final String title;
  final String department;
  final String location;
  final String type;
  final String description;
  final List<String> skills;
  final int applicants;

  factory JobOffer.fromData(String id, Map<String, dynamic> data) {
    return JobOffer(
      id: id,
      title: data['title']?.toString() ?? 'Offre sans titre',
      department: data['department']?.toString() ?? 'Departement',
      location: data['location']?.toString() ?? 'Localisation',
      type: data['type']?.toString() ?? 'Full-time',
      description:
          data['description']?.toString() ?? 'Pas encore de description.',
      skills: (data['skills'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
      applicants: (data['applicants'] as num?)?.toInt() ?? 0,
    );
  }

  factory JobOffer.fromSnapshot(
      DocumentSnapshot<Map<String, dynamic>> snapshot) {
    return JobOffer.fromData(snapshot.id, snapshot.data() ?? {});
  }
}

dynamic parseFirestoreRestValue(Map<String, dynamic> value) {
  if (value.containsKey('stringValue')) {
    return value['stringValue'];
  }
  if (value.containsKey('integerValue')) {
    return int.tryParse(value['integerValue'].toString()) ?? 0;
  }
  if (value.containsKey('doubleValue')) {
    return double.tryParse(value['doubleValue'].toString()) ?? 0;
  }
  if (value.containsKey('booleanValue')) {
    return value['booleanValue'] == true;
  }
  if (value.containsKey('timestampValue')) {
    return value['timestampValue'];
  }
  if (value.containsKey('arrayValue')) {
    final values = (value['arrayValue'] as Map<String, dynamic>)['values']
            as List<dynamic>? ??
        [];
    return values
        .map((item) =>
            parseFirestoreRestValue(Map<String, dynamic>.from(item as Map)))
        .toList();
  }
  if (value.containsKey('mapValue')) {
    final fields = (value['mapValue'] as Map<String, dynamic>)['fields']
            as Map<String, dynamic>? ??
        {};
    return parseFirestoreRestFields(fields);
  }
  return null;
}

Map<String, dynamic> parseFirestoreRestFields(Map<String, dynamic> fields) {
  return fields.map((key, value) => MapEntry(
      key, parseFirestoreRestValue(Map<String, dynamic>.from(value as Map))));
}

Map<String, dynamic> encodeFirestoreRestValue(dynamic value) {
  if (value == null) {
    return {'nullValue': null};
  }
  if (value is String) {
    return {'stringValue': value};
  }
  if (value is int) {
    return {'integerValue': value.toString()};
  }
  if (value is double) {
    return {'doubleValue': value};
  }
  if (value is bool) {
    return {'booleanValue': value};
  }
  if (value is DateTime) {
    return {'timestampValue': value.toUtc().toIso8601String()};
  }
  if (value is List) {
    return {
      'arrayValue': {
        'values': value.map(encodeFirestoreRestValue).toList(),
      },
    };
  }
  if (value is Map<String, dynamic>) {
    return {
      'mapValue': {
        'fields': encodeFirestoreRestFields(value),
      },
    };
  }
  return {'stringValue': value.toString()};
}

Map<String, dynamic> encodeFirestoreRestFields(Map<String, dynamic> data) {
  return data
      .map((key, value) => MapEntry(key, encodeFirestoreRestValue(value)));
}

Future<String> createWebFirestoreDocument(
    String collectionPath, Map<String, dynamic> data) async {
  final response = await http.post(
    Uri.parse(
      'https://firestore.googleapis.com/v1/projects/$webFirebaseProjectId/databases/(default)/documents/$collectionPath?key=$webFirebaseApiKey',
    ),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'fields': encodeFirestoreRestFields(data)}),
  );

  final body = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode < 200 || response.statusCode >= 300) {
    final message =
        (body['error'] as Map<String, dynamic>?)?['message']?.toString() ??
            'Synchronisation RH impossible.';
    throw Exception(message);
  }

  return body['name'].toString().split('/').last;
}

Future<void> patchWebFirestoreDocument(
    String documentPath, Map<String, dynamic> data) async {
  final masks = data.keys.map((key) => 'updateMask.fieldPaths=$key').join('&');
  final response = await http.patch(
    Uri.parse(
      'https://firestore.googleapis.com/v1/projects/$webFirebaseProjectId/databases/(default)/documents/$documentPath?$masks&key=$webFirebaseApiKey',
    ),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'fields': encodeFirestoreRestFields(data)}),
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw Exception('Mise a jour web ignoree.');
  }
}

Future<List<JobOffer>> fetchWebPublishedJobs() async {
  final response = await http.get(
    Uri.parse(
      'https://firestore.googleapis.com/v1/projects/$webFirebaseProjectId/databases/(default)/documents/jobs?key=$webFirebaseApiKey',
    ),
  );

  final data = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode < 200 || response.statusCode >= 300) {
    final message =
        (data['error'] as Map<String, dynamic>?)?['message']?.toString() ??
            'Chargement des offres impossible.';
    throw Exception(message);
  }

  final documents = data['documents'] as List<dynamic>? ?? [];
  final jobs = documents
      .map((item) {
        final document = Map<String, dynamic>.from(item as Map);
        final id = document['name'].toString().split('/').last;
        final fields =
            Map<String, dynamic>.from(document['fields'] as Map? ?? {});
        final parsed = parseFirestoreRestFields(fields);
        if ((parsed['status'] ?? 'Published') != 'Published') return null;
        return JobOffer.fromData(id, parsed);
      })
      .where((job) {
        return job != null && job.title.trim().isNotEmpty;
      })
      .cast<JobOffer>()
      .toList();

  jobs.sort((a, b) => a.title.compareTo(b.title));
  return jobs;
}

Future<List<Map<String, dynamic>>> fetchWebNotifications(String userId) async {
  final response = await http.get(
    Uri.parse(
      'https://firestore.googleapis.com/v1/projects/$webFirebaseProjectId/databases/(default)/documents/notifications/$userId/items?key=$webFirebaseApiKey',
    ),
  );

  final data = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode < 200 || response.statusCode >= 300) {
    final message =
        (data['error'] as Map<String, dynamic>?)?['message']?.toString() ??
            'Notifications indisponibles.';
    throw Exception(message);
  }

  final documents = data['documents'] as List<dynamic>? ?? [];
  final notifications = documents.map((item) {
    final document = Map<String, dynamic>.from(item as Map);
    final fields = Map<String, dynamic>.from(document['fields'] as Map? ?? {});
    final parsed = parseFirestoreRestFields(fields);
    parsed['id'] = document['name'].toString().split('/').last;
    return parsed;
  }).toList();

  notifications.sort(
      (a, b) => b['createdAt'].toString().compareTo(a['createdAt'].toString()));
  return notifications;
}

Future<List<Map<String, dynamic>>> fetchWebApplications(String userId) async {
  final response = await http.get(
    Uri.parse(
      'https://firestore.googleapis.com/v1/projects/$webFirebaseProjectId/databases/(default)/documents/applications?key=$webFirebaseApiKey',
    ),
  );

  final data = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode < 200 || response.statusCode >= 300) {
    final message =
        (data['error'] as Map<String, dynamic>?)?['message']?.toString() ??
            'Candidatures indisponibles.';
    throw Exception(message);
  }

  final documents = data['documents'] as List<dynamic>? ?? [];
  final applications = documents
      .map((item) {
        final document = Map<String, dynamic>.from(item as Map);
        final fields =
            Map<String, dynamic>.from(document['fields'] as Map? ?? {});
        final parsed = parseFirestoreRestFields(fields);
        parsed['id'] = document['name'].toString().split('/').last;
        return parsed;
      })
      .where((application) => application['userId']?.toString() == userId)
      .toList();

  applications.sort(
      (a, b) => b['createdAt'].toString().compareTo(a['createdAt'].toString()));
  return applications;
}

Future<String> getCandidateProfilePhotoUrl(
    String userId, String fallback) async {
  final authUser = FirebaseAuth.instance.currentUser;
  if (authUser?.uid == userId && (authUser?.photoURL ?? '').isNotEmpty) {
    return authUser!.photoURL!;
  }

  try {
    final snap =
        await FirebaseFirestore.instance.collection('users').doc(userId).get();
    final data = snap.data() ?? {};
    return (data['photoUrl'] ?? data['candidatePhotoUrl'] ?? fallback)
        .toString();
  } catch (_) {
    return fallback;
  }
}

Stream<List<JobOffer>> webPublishedJobsStream() async* {
  yield await fetchWebPublishedJobs();
  yield* Stream.periodic(const Duration(seconds: 8))
      .asyncMap((_) => fetchWebPublishedJobs());
}

Stream<List<Map<String, dynamic>>> webApplicationsStream(String userId) async* {
  yield await fetchWebApplications(userId);
  yield* Stream.periodic(const Duration(seconds: 8))
      .asyncMap((_) => fetchWebApplications(userId));
}

Stream<List<Map<String, dynamic>>> webNotificationsStream(
    String userId) async* {
  yield await fetchWebNotifications(userId);
  yield* Stream.periodic(const Duration(seconds: 8))
      .asyncMap((_) => fetchWebNotifications(userId));
}

Future<void> markWebNotificationRead(
    String userId, String notificationId) async {
  await patchWebFirestoreDocument(
      'notifications/$userId/items/$notificationId', {
    'read': true,
  });
}

List<String> normalizeStringList(dynamic value) {
  if (value is List) {
    return value
        .map((item) => item.toString().trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }
  if (value == null) return [];
  return value
      .toString()
      .split(RegExp(r'[,;\n]'))
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList();
}

Map<String, dynamic> parseGeminiJson(String value) {
  final cleaned = value
      .trim()
      .replaceAll(RegExp(r'^```json\s*|^```\s*|```$', multiLine: true), '')
      .trim();
  final start = cleaned.indexOf('{');
  final end = cleaned.lastIndexOf('}');
  if (start == -1 || end == -1 || end <= start) {
    throw Exception('Reponse IA invalide.');
  }
  return jsonDecode(cleaned.substring(start, end + 1)) as Map<String, dynamic>;
}

class CandidateGate extends StatefulWidget {
  const CandidateGate({super.key});

  @override
  State<CandidateGate> createState() => _CandidateGateState();
}

class _CandidateGateState extends State<CandidateGate> {
  CandidateProfile? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _startFreshSession();
  }

  Future<void> _startFreshSession() async {
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    FirebaseAuth.instance.authStateChanges().listen(_syncAuthProfile);
    setState(() {
      _loading = false;
    });
  }

  Future<void> _syncAuthProfile(User? user) async {
    if (!mounted) return;

    if (user == null) {
      setState(() {
        _profile = null;
        _loading = false;
      });
      return;
    }

    await _openCandidateSession(user);
  }

  Future<void> _openCandidateSession(User user, {String? preferredName}) async {
    var name = preferredName?.trim();
    var email = user.email ?? '';
    var photoUrl = user.photoURL ?? '';
    final profileRef =
        FirebaseFirestore.instance.collection('users').doc(user.uid);

    try {
      final profileSnap = await profileRef.get();
      final data = profileSnap.data() ?? {};
      name = (name?.isNotEmpty == true
              ? name
              : data['name'] ??
                  user.displayName ??
                  user.email?.split('@').first ??
                  'Candidat')
          .toString();
      email = (data['email'] ?? user.email ?? '').toString();
      photoUrl =
          (data['photoUrl'] ?? data['candidatePhotoUrl'] ?? user.photoURL ?? '')
              .toString();

      await profileRef.set({
        'name': name,
        'email': email,
        'role': 'candidate',
        'photoUrl': photoUrl,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (_) {
      name = name?.isNotEmpty == true
          ? name
          : user.displayName ?? user.email?.split('@').first ?? 'Candidat';
    }

    if (!mounted) return;

    setState(() {
      _profile = CandidateProfile(
          id: user.uid, name: name!, email: email, photoUrl: photoUrl);
      _loading = false;
    });
  }

  String _authErrorMessage(Object error) {
    if (error is! FirebaseAuthException) {
      return 'Operation impossible. Reessayez.';
    }

    switch (error.code) {
      case 'invalid-email':
        return 'Email invalide.';
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Email ou mot de passe incorrect.';
      case 'email-already-in-use':
        return 'Cet email existe deja. Connectez-vous avec ce compte.';
      case 'weak-password':
        return 'Le mot de passe doit contenir au moins 6 caracteres.';
      case 'operation-not-allowed':
        return 'Activez Email/Password dans Firebase Authentication.';
      case 'network-request-failed':
        return 'Connexion internet indisponible.';
      default:
        return error.message ?? 'Authentification impossible.';
    }
  }

  Future<void> _login(String email, String password) async {
    try {
      final credential = await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      if (credential.user != null) {
        await _openCandidateSession(credential.user!);
      }
    } catch (error) {
      throw Exception(_authErrorMessage(error));
    }
  }

  Future<void> _register(String name, String email, String password) async {
    try {
      final credential =
          await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      final displayName = name.trim();
      await credential.user?.updateDisplayName(displayName);
      if (credential.user != null) {
        await _openCandidateSession(credential.user!,
            preferredName: displayName);
      }
    } catch (error) {
      throw Exception(_authErrorMessage(error));
    }
  }

  Future<void> _logout() async {
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    setState(() {
      _profile = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_profile == null) {
      return LoginPage(onLogin: _login, onRegister: _register);
    }
    return CandidateShell(profile: _profile!, onLogout: _logout);
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onLogin, required this.onRegister});

  final Future<void> Function(String email, String password) onLogin;
  final Future<void> Function(String name, String email, String password)
      onRegister;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isRegister = false;
  bool _loading = false;
  bool _showPassword = false;
  bool _rememberMe = false;
  String _error = '';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      if (_isRegister) {
        await widget.onRegister(
          _nameController.text.trim(),
          _emailController.text.trim(),
          _passwordController.text,
        );
      } else {
        await widget.onLogin(
            _emailController.text.trim(), _passwordController.text);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/hireq-login-background.png',
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
          ),
          Positioned(
            left: 32,
            top: MediaQuery.paddingOf(context).top + 245,
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 4,
                  width: 52,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Color(0xFFFF7900),
                      borderRadius: BorderRadius.all(Radius.circular(99)),
                    ),
                  ),
                ),
                SizedBox(height: 28),
                Text(
                  'Connectez-vous à votre espace',
                  style: TextStyle(
                    color: Color(0xFF1D2B5F),
                    fontSize: 18,
                    height: 1.38,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  'candidat pour gérer vos candidatures',
                  style: TextStyle(
                    color: Color(0xFF1D2B5F),
                    fontSize: 18,
                    height: 1.38,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  'et suivre vos opportunités.',
                  style: TextStyle(
                    color: Color(0xFF1D2B5F),
                    fontSize: 18,
                    height: 1.38,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(27, 390, 27, 28),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(27),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 2, sigmaY: 2),
                    child: Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 536),
                      padding: const EdgeInsets.fromLTRB(24, 31, 24, 27),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(28),
                        borderRadius: BorderRadius.circular(27),
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Center(
                              child: Container(
                                height: 0,
                                width: 0,
                                decoration: BoxDecoration(
                                  color: Colors.white.withAlpha(246),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          const Color(0xFF1D4ED8).withAlpha(42),
                                      blurRadius: 18,
                                      offset: const Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: ShaderMask(
                                  blendMode: BlendMode.srcIn,
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                    colors: [
                                      Color(0xFF0EA5FF),
                                      Color(0xFF322DFF)
                                    ],
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                  ).createShader(bounds),
                                  child: const Icon(Icons.person, size: 42),
                                ),
                              ),
                            ),
                            const SizedBox(height: 0),
                            const Text(
                              '',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 0,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF070C34),
                              ),
                            ),
                            const SizedBox(height: 0),
                            const Text(
                              '',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF4D5172),
                                height: 1.48,
                                fontSize: 0,
                              ),
                            ),
                            const SizedBox(height: 0),
                            _AuthSegmentedToggle(
                              isRegister: _isRegister,
                              onChanged: (value) {
                                setState(() {
                                  _isRegister = value;
                                  _error = '';
                                });
                              },
                            ),
                            const SizedBox(height: 24),
                            if (_isRegister) ...[
                              TextFormField(
                                controller: _nameController,
                                decoration: glassInputDecoration(
                                    'Nom complet', Icons.person_outline),
                                validator: (value) => _isRegister &&
                                        (value == null || value.trim().isEmpty)
                                    ? 'Le nom est requis.'
                                    : null,
                              ),
                              const SizedBox(height: 16),
                            ],
                            TextFormField(
                              controller: _emailController,
                              decoration: glassInputDecoration(
                                  'Email address', Icons.mail_outline),
                              keyboardType: TextInputType.emailAddress,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Email requis.';
                                }
                                if (!value.contains('@')) {
                                  return 'Email invalide.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _passwordController,
                              obscureText: !_showPassword,
                              decoration: glassInputDecoration(
                                      'Mot de passe', Icons.lock_outline)
                                  .copyWith(
                                suffixIcon: IconButton(
                                  onPressed: () => setState(
                                      () => _showPassword = !_showPassword),
                                  icon: Icon(_showPassword
                                      ? Icons.visibility_off_outlined
                                      : Icons.visibility_outlined),
                                  color: const Color(0xFF111636),
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Mot de passe requis.';
                                }
                                if (value.length < 6) {
                                  return 'Minimum 6 caractères.';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 19),
                            Row(
                              children: [
                                Checkbox(
                                  value: _rememberMe,
                                  onChanged: (value) => setState(
                                      () => _rememberMe = value ?? false),
                                  activeColor: const Color(0xFF3445FF),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(5)),
                                ),
                                const Expanded(
                                  child: Text(
                                    'Se souvenir de moi',
                                    style: TextStyle(
                                        color: Color(0xFF232744),
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14.5),
                                  ),
                                ),
                                TextButton(
                                  style: TextButton.styleFrom(
                                    padding: EdgeInsets.zero,
                                    minimumSize: const Size(0, 36),
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  onPressed: () {},
                                  child: const Text(
                                    'Mot de passe oublié ?',
                                    style: TextStyle(
                                        color: Color(0xFF4565D5),
                                        fontWeight: FontWeight.w700,
                                        fontSize: 14.5),
                                  ),
                                ),
                              ],
                            ),
                            if (_error.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFE4E6).withAlpha(225),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(_error,
                                    style: const TextStyle(
                                        color: Color(0xFFBE123C))),
                              ),
                            ],
                            const SizedBox(height: 25),
                            FilledButton(
                              onPressed: _loading ? null : _submit,
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFFFF7615),
                                foregroundColor: const Color(0xFFFFF4E7),
                                disabledBackgroundColor:
                                    const Color(0xFFFFA45F),
                                fixedSize: const Size.fromHeight(58),
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 22),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(28)),
                                elevation: 8,
                                shadowColor:
                                    const Color(0xFFEA580C).withAlpha(100),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Text(
                                      _loading
                                          ? 'Validation...'
                                          : _isRegister
                                              ? 'Créer le compte'
                                              : 'Se connecter',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                  const Icon(Icons.arrow_forward,
                                      color: Colors.white, size: 30),
                                ],
                              ),
                            ),
                            const SizedBox(height: 30),
                            TextButton(
                              onPressed: () =>
                                  setState(() => _isRegister = !_isRegister),
                              child: Text.rich(
                                TextSpan(
                                  text: _isRegister
                                      ? 'Déjà un compte ? '
                                      : 'Pas encore de compte ? ',
                                  style: const TextStyle(
                                      color: Color(0xFF1D2248),
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14.5),
                                  children: [
                                    TextSpan(
                                      text: _isRegister
                                          ? 'Se connecter'
                                          : 'Créer un compte',
                                      style: const TextStyle(
                                          color: Color(0xFF315BD8),
                                          fontWeight: FontWeight.w900),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthSegmentedToggle extends StatelessWidget {
  const _AuthSegmentedToggle({
    required this.isRegister,
    required this.onChanged,
  });

  final bool isRegister;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 92,
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(8),
        border: Border(
          bottom: BorderSide(color: const Color(0xFFE3E8F6).withAlpha(160)),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _AuthSegmentButton(
              active: !isRegister,
              icon: Icons.lock_outline,
              label: 'Connexion',
              subtitle: 'Accédez à votre compte',
              onTap: () => onChanged(false),
            ),
          ),
          Container(
            width: 1,
            height: 54,
            color: const Color(0xFFD8DEEC).withAlpha(185),
          ),
          Expanded(
            child: _AuthSegmentButton(
              active: isRegister,
              icon: Icons.person_add_alt_1_outlined,
              label: 'Inscription',
              subtitle: 'Créez un nouveau compte',
              onTap: () => onChanged(true),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthSegmentButton extends StatelessWidget {
  const _AuthSegmentButton({
    required this.active,
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  final bool active;
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = active ? const Color(0xFF075CFF) : const Color(0xFFFF7900);

    return InkWell(
      onTap: onTap,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  height: 58,
                  width: 58,
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(236),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF1D4ED8).withAlpha(18),
                        blurRadius: 16,
                        offset: const Offset(0, 9),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: accent, size: 30),
                ),
                const SizedBox(width: 16),
                Flexible(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: active
                              ? const Color(0xFF075CFF)
                              : const Color(0xFF07154C),
                          fontWeight: FontWeight.w900,
                          fontSize: 16.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF536088),
                          fontWeight: FontWeight.w500,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: 2,
            width: active ? 42 : 0,
            decoration: BoxDecoration(
              color: const Color(0xFF075CFF),
              borderRadius: BorderRadius.circular(99),
            ),
          ),
        ],
      ),
    );
  }
}

class CandidateShell extends StatefulWidget {
  const CandidateShell({
    super.key,
    required this.profile,
    required this.onLogout,
  });

  final CandidateProfile profile;
  final VoidCallback onLogout;

  @override
  State<CandidateShell> createState() => _CandidateShellState();
}

class _CandidateShellState extends State<CandidateShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: webNotificationsStream(widget.profile.id),
      builder: (context, notificationSnapshot) {
        final notificationCount = (notificationSnapshot.data ?? [])
            .where((notification) => notification['read'] != true)
            .length;
        final pages = [
          HomeTab(
              profile: widget.profile,
              notificationCount: notificationCount,
              onOpenJobs: () => setState(() => _currentIndex = 1),
              onOpenSpontaneous: () => setState(() => _currentIndex = 2),
              onOpenNotifications: () => setState(() => _currentIndex = 3)),
          JobsTab(profile: widget.profile),
          SpontaneousTab(profile: widget.profile),
          NotificationsTab(profile: widget.profile),
          ProfileTab(profile: widget.profile, onLogout: widget.onLogout),
        ];

        return Scaffold(
          body: SafeArea(child: pages[_currentIndex]),
          bottomNavigationBar: CandidateBottomNav(
            selectedIndex: _currentIndex,
            notificationCount: notificationCount,
            onSelected: (value) => setState(() => _currentIndex = value),
          ),
        );
      },
    );
  }
}

class CandidateBottomNav extends StatelessWidget {
  const CandidateBottomNav({
    super.key,
    required this.selectedIndex,
    required this.notificationCount,
    required this.onSelected,
  });

  final int selectedIndex;
  final int notificationCount;
  final ValueChanged<int> onSelected;

  static const _items = [
    _BottomNavItem(Icons.home_outlined, Icons.home, 'Accueil'),
    _BottomNavItem(Icons.work_outline, Icons.work, 'Offres'),
    _BottomNavItem(Icons.send_outlined, Icons.send, 'Spontane'),
    _BottomNavItem(Icons.notifications_none, Icons.notifications, 'Notifs'),
    _BottomNavItem(Icons.person_outline, Icons.person, 'Profil'),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(8, 0, 8, 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(246),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF94A3B8).withAlpha(34),
              blurRadius: 26,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: Row(
          children: List.generate(_items.length, (index) {
            final item = _items[index];
            final active = index == selectedIndex;
            final badge = index == 3 && notificationCount > 0
                ? notificationCount
                : null;
            return Expanded(
              child: InkWell(
                onTap: () => onSelected(index),
                borderRadius: BorderRadius.circular(19),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            height: 38,
                            width: active ? 55 : 38,
                            decoration: BoxDecoration(
                              color: active
                                  ? const Color(0xFFEDEBFF)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(19),
                              boxShadow: active
                                  ? [
                                      BoxShadow(
                                        color: const Color(0xFF4D2FFF)
                                            .withAlpha(38),
                                        blurRadius: 18,
                                        offset: const Offset(0, 8),
                                      )
                                    ]
                                  : null,
                            ),
                            child: Icon(
                              active ? item.selectedIcon : item.icon,
                              color: active
                                  ? const Color(0xFF4427EE)
                                  : const Color(0xFF111636),
                              size: 25,
                            ),
                          ),
                          if (badge != null)
                            Positioned(
                              right: active ? 5 : -5,
                              top: -8,
                              child: BadgeDot(count: badge),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: active
                              ? const Color(0xFF4427EE)
                              : const Color(0xFF070C34),
                          fontSize: 12.5,
                          fontWeight:
                              active ? FontWeight.w800 : FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _BottomNavItem {
  const _BottomNavItem(this.icon, this.selectedIcon, this.label);

  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

class BadgeDot extends StatelessWidget {
  const BadgeDot({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 20,
      width: 20,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Color(0xFF5138F5),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          height: 1,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class HomeTab extends StatelessWidget {
  const HomeTab({
    super.key,
    required this.profile,
    required this.notificationCount,
    required this.onOpenJobs,
    required this.onOpenSpontaneous,
    required this.onOpenNotifications,
  });

  final CandidateProfile profile;
  final int notificationCount;
  final VoidCallback onOpenJobs;
  final VoidCallback onOpenSpontaneous;
  final VoidCallback onOpenNotifications;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: webApplicationsStream(profile.id),
      builder: (context, snapshot) {
        final applications = snapshot.data ?? [];

        return Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/home-background.png',
              fit: BoxFit.cover,
              alignment: Alignment.center,
            ),
            Container(color: Colors.white.withAlpha(12)),
            ListView(
              padding: const EdgeInsets.fromLTRB(16, 26, 16, 18),
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Bonjour, ${profile.name} 👋',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 26,
                                  height: 1.08,
                                  color: Color(0xFF070C34),
                                  fontWeight: FontWeight.w900)),
                          const SizedBox(height: 8),
                          const Text(
                            'Les offres web ajoutées dans le dashboard apparaissent ici automatiquement.',
                            style: TextStyle(
                                color: Color(0xFF161B43),
                                fontSize: 14.5,
                                height: 1.25,
                                fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    NotificationBubble(
                      count: notificationCount,
                      onTap: onOpenNotifications,
                    ),
                  ],
                ),
                const SizedBox(height: 31),
                Row(
                  children: [
                    Expanded(
                      child: ActionCard(
                        assetPath: 'assets/home-offers-card.png',
                        label: 'Offres',
                        onTap: onOpenJobs,
                      ),
                    ),
                    const SizedBox(width: 13),
                    Expanded(
                      child: ActionCard(
                        assetPath: 'assets/home-spontaneous-card.png',
                        label: 'Spontane',
                        onTap: onOpenSpontaneous,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 33),
                Row(
                  children: [
                    const Expanded(
                      child: Text('Mes candidatures',
                          style: TextStyle(
                              fontSize: 22,
                              color: Color(0xFF070C34),
                              fontWeight: FontWeight.w900)),
                    ),
                    ViewAllPill(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => AllApplicationsPage(
                            profile: profile,
                            initialApplications: applications,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 17),
                if (applications.isEmpty)
                  InfoCard(
                    icon: Icons.description_outlined,
                    title: 'Aucune candidature pour le moment',
                    subtitle:
                        'Dès que vous postulez, les statistiques web se mettent à jour.',
                    actionLabel: 'Voir les offres',
                    onAction: onOpenJobs,
                  )
                else
                  ...applications.take(3).map((data) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ApplicationTile(
                        application: data,
                        title: data['jobTitle']?.toString() ?? 'Offre',
                        subtitle: applicationStatusLabel(data),
                        date: formatFirestoreDate(data['createdAt']),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => ApplicationStatusPage(
                              profile: profile,
                              applicationId: data['id'].toString(),
                              initialApplication: data,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                const SizedBox(height: 270),
              ],
            ),
          ],
        );
      },
    );
  }
}

class AllApplicationsPage extends StatelessWidget {
  const AllApplicationsPage({
    super.key,
    required this.profile,
    required this.initialApplications,
  });

  final CandidateProfile profile;
  final List<Map<String, dynamic>> initialApplications;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F7FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF7F7FF),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF5A31FF)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Mes candidatures',
          style: TextStyle(
            color: Color(0xFF070C34),
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: webApplicationsStream(profile.id),
        initialData: initialApplications,
        builder: (context, snapshot) {
          final applications = snapshot.data ?? [];

          if (applications.isEmpty) {
            return const Padding(
              padding: EdgeInsets.all(20),
              child: InfoCard(
                icon: Icons.description_outlined,
                title: 'Aucune candidature pour le moment',
                subtitle: 'Les candidatures envoyees apparaitront ici.',
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: applications.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final data = applications[index];
              return ApplicationTile(
                application: data,
                title: data['jobTitle']?.toString() ?? 'Offre',
                subtitle: applicationStatusLabel(data),
                date: formatFirestoreDate(data['createdAt']),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ApplicationStatusPage(
                      profile: profile,
                      applicationId: data['id'].toString(),
                      initialApplication: data,
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class JobsTab extends StatelessWidget {
  const JobsTab({super.key, required this.profile});

  final CandidateProfile profile;

  Future<String> _uploadPdfToStorage({
    required String folder,
    required String candidateId,
    required PickedPdf pdf,
  }) async {
    return uploadPdfToCloudinary(
        folder: folder, candidateId: candidateId, pdf: pdf);
  }

  Future<PickedPdf?> _pickPdf() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf'],
      withData: true,
    );
    final file = result?.files.single;
    if (file == null || file.bytes == null) return null;
    return PickedPdf(bytes: file.bytes!, name: file.name);
  }

  AiAnalysisResult _analyzePdfLocally(String rawText, JobOffer job,
      {String provider = 'Local fallback'}) {
    final normalizedText = rawText.toLowerCase();
    final extractedSkills = <String>[];
    final skillGaps = <String>[];

    for (final skill in job.skills) {
      if (normalizedText.contains(skill.toLowerCase())) {
        extractedSkills.add(skill);
      } else {
        skillGaps.add(skill);
      }
    }

    final totalSkills = job.skills.isEmpty ? 1 : job.skills.length;
    final matchingScore = ((extractedSkills.length / totalSkills) * 100)
        .round()
        .clamp(35, 100)
        .toInt();
    final aiScore = (matchingScore * 0.85 + 12).round().clamp(40, 98).toInt();
    final preview = rawText.replaceAll(RegExp(r'\s+'), ' ').trim();

    return AiAnalysisResult(
      aiScore: aiScore,
      matchingScore: matchingScore,
      extractedSkills: extractedSkills,
      aiSummary: extractedSkills.isEmpty
          ? 'Analyse automatique terminee. Le CV est recu, mais peu de mots-cles de l offre ont ete detectes.'
          : 'Analyse automatique terminee. ${extractedSkills.length} competences de l offre ont ete retrouvees dans le CV.',
      cvTextPreview:
          preview.length > 500 ? '${preview.substring(0, 500)}...' : preview,
      skillGaps: skillGaps,
      matchedRequirements: extractedSkills,
      strengths:
          extractedSkills.isEmpty ? ['CV recu et lisible'] : extractedSkills,
      risks: skillGaps.isEmpty
          ? ['A verifier en entretien']
          : skillGaps.map((skill) => 'Verifier le niveau en $skill').toList(),
      interviewQuestions: skillGaps
          .take(4)
          .map((skill) => 'Pouvez-vous decrire votre experience avec $skill ?')
          .toList(),
      recommendation: matchingScore >= 75
          ? 'Shortlist'
          : matchingScore >= 55
              ? 'Review'
              : 'Reject',
      provider: provider,
    );
  }

  Future<AiAnalysisResult> _analyzePdf(PickedPdf pdf, JobOffer job) async {
    final document = PdfDocument(inputBytes: pdf.bytes);
    final rawText = PdfTextExtractor(document).extractText();
    document.dispose();

    final preview = rawText.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (preview.isEmpty) {
      return _analyzePdfLocally(rawText, job,
          provider: 'Local fallback - PDF text empty');
    }

    final prompt = '''
Tu es un assistant RH senior. Compare ce CV avec l'offre et retourne uniquement un JSON valide.

Offre:
- Titre: ${job.title}
- Departement: ${job.department}
- Localisation: ${job.location}
- Type: ${job.type}
- Competences requises: ${job.skills.join(', ')}
- Description: ${job.description}

CV:
${preview.length > 12000 ? preview.substring(0, 12000) : preview}

JSON attendu:
{
  "matchingScore": 0-100,
  "recommendation": "Shortlist" | "Review" | "Reject",
  "summary": "resume RH court en francais",
  "extractedSkills": ["competences detectees dans le CV"],
  "matchedRequirements": ["conditions satisfaites"],
  "missingRequirements": ["conditions manquantes"],
  "strengths": ["points forts"],
  "risks": ["points a verifier"],
  "interviewQuestions": ["questions ciblees"]
}
''';

    for (final model in geminiModels) {
      try {
        final response = await http.post(
          Uri.parse(
              'https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=$geminiApiKey'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'contents': [
              {
                'role': 'user',
                'parts': [
                  {'text': prompt},
                ],
              }
            ],
            'generationConfig': {
              'temperature': 0.2,
              'responseMimeType': 'application/json',
            },
          }),
        );

        if (response.statusCode == 404) continue;
        if (response.statusCode < 200 || response.statusCode >= 300) continue;

        final body = jsonDecode(response.body) as Map<String, dynamic>;
        final candidates = body['candidates'] as List<dynamic>? ?? [];
        final firstCandidate = candidates.isEmpty
            ? null
            : Map<String, dynamic>.from(candidates.first as Map);
        final content = firstCandidate == null
            ? null
            : Map<String, dynamic>.from(
                firstCandidate['content'] as Map? ?? {});
        final parts = content == null
            ? <dynamic>[]
            : content['parts'] as List<dynamic>? ?? [];
        final text = parts
            .map((part) =>
                (part as Map<String, dynamic>)['text']?.toString() ?? '')
            .join('\n');
        final data = parseGeminiJson(text);
        final matchingScore = ((data['matchingScore'] as num?)?.round() ?? 0)
            .clamp(0, 100)
            .toInt();
        final aiScore = (matchingScore * 0.9 + 8).round().clamp(0, 100).toInt();

        return AiAnalysisResult(
          aiScore: aiScore,
          matchingScore: matchingScore,
          extractedSkills: normalizeStringList(data['extractedSkills']),
          aiSummary:
              data['summary']?.toString() ?? 'Analyse automatique terminee.',
          cvTextPreview: preview.length > 500
              ? '${preview.substring(0, 500)}...'
              : preview,
          skillGaps: normalizeStringList(data['missingRequirements']),
          matchedRequirements: normalizeStringList(data['matchedRequirements']),
          strengths: normalizeStringList(data['strengths']),
          risks: normalizeStringList(data['risks']),
          interviewQuestions: normalizeStringList(data['interviewQuestions']),
          recommendation: data['recommendation']?.toString() ??
              (matchingScore >= 75
                  ? 'Shortlist'
                  : matchingScore >= 55
                      ? 'Review'
                      : 'Reject'),
          provider: 'Gemini $model',
        );
      } catch (_) {
        continue;
      }
    }

    return _analyzePdfLocally(rawText, job);
  }

  Future<Map<String, dynamic>?> _existingApplicationFor(JobOffer job) async {
    final applications = await fetchWebApplications(profile.id);
    for (final application in applications) {
      if (application['jobId']?.toString() == job.id) {
        return application;
      }
    }
    return null;
  }

  Future<void> _apply(BuildContext context, JobOffer job) async {
    final existingApplication = await _existingApplicationFor(job);
    if (existingApplication != null) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF4F46E5),
          behavior: SnackBarBehavior.floating,
          content: Text('Vous avez deja postule a cette offre.'),
        ),
      );
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ApplicationStatusPage(
            profile: profile,
            applicationId: existingApplication['id'].toString(),
            initialApplication: existingApplication,
          ),
        ),
      );
      return;
    }
    if (!context.mounted) return;

    PickedPdf? selectedPdf;
    bool submitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            Future<void> handleSubmit() async {
              if (selectedPdf == null) {
                ScaffoldMessenger.of(sheetContext).showSnackBar(const SnackBar(
                    content: Text('Veuillez selectionner un CV PDF.')));
                return;
              }

              try {
                setSheetState(() {
                  submitting = true;
                });

                final duplicateApplication = await _existingApplicationFor(job);
                if (duplicateApplication != null) {
                  if (sheetContext.mounted) {
                    Navigator.of(sheetContext).pop();
                  }
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      backgroundColor: Color(0xFF4F46E5),
                      behavior: SnackBarBehavior.floating,
                      content: Text('Vous avez deja postule a cette offre.'),
                    ),
                  );
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ApplicationStatusPage(
                        profile: profile,
                        applicationId: duplicateApplication['id'].toString(),
                        initialApplication: duplicateApplication,
                      ),
                    ),
                  );
                  return;
                }

                final analysis = await _analyzePdf(selectedPdf!, job);
                final downloadUrl = await _uploadPdfToStorage(
                  folder: 'cvs',
                  candidateId: profile.id,
                  pdf: selectedPdf!,
                );
                final candidatePhotoUrl = await getCandidateProfilePhotoUrl(
                    profile.id, profile.photoUrl);

                final applicationId =
                    await createWebFirestoreDocument('applications', {
                  'jobId': job.id,
                  'jobTitle': job.title,
                  'role': job.title,
                  'department': job.department,
                  'location': job.location,
                  'userId': profile.id,
                  'candidateName': profile.name,
                  'candidateEmail': profile.email,
                  'candidatePhotoUrl': candidatePhotoUrl,
                  'cvUrl': downloadUrl,
                  'cvFileName': selectedPdf!.name,
                  'jobSkills': job.skills,
                  'status': 'Applied',
                  'aiStatus': 'completed',
                  'aiProvider': analysis.provider,
                  'recommendation': analysis.recommendation,
                  'score': analysis.aiScore,
                  'aiScore': analysis.aiScore,
                  'matchingScore': analysis.matchingScore,
                  'aiSummary': analysis.aiSummary,
                  'extractedSkills': analysis.extractedSkills,
                  'skillGaps': analysis.skillGaps,
                  'matchedRequirements': analysis.matchedRequirements,
                  'strengths': analysis.strengths,
                  'risks': analysis.risks,
                  'interviewQuestions': analysis.interviewQuestions,
                  'cvTextPreview': analysis.cvTextPreview,
                  'createdAt': DateTime.now().toUtc(),
                });

                try {
                  await patchWebFirestoreDocument('jobs/${job.id}', {
                    'applicants': job.applicants + 1,
                    'updatedAt': DateTime.now().toUtc(),
                  });
                } catch (_) {
                  // Le compteur n'est pas bloquant pour la reception RH de la candidature.
                }

                await createWebFirestoreDocument('notifications/hr/items', {
                  'title': 'Nouvelle candidature recue',
                  'message':
                      '${profile.name} a envoye son CV pour ${job.title}. Analyse IA: ${analysis.matchingScore}% (${analysis.recommendation}).',
                  'type': 'application',
                  'read': false,
                  'applicationId': applicationId,
                  'candidateName': profile.name,
                  'candidateEmail': profile.email,
                  'candidatePhotoUrl': candidatePhotoUrl,
                  'jobId': job.id,
                  'jobTitle': job.title,
                  'cvFileName': selectedPdf!.name,
                  'createdAt': DateTime.now().toUtc(),
                });

                await createWebFirestoreDocument(
                    'notifications/${profile.id}/items', {
                  'title': 'Votre CV a ete envoye',
                  'message':
                      'Votre CV a ete envoye avec succes pour ${job.title}.',
                  'type': 'application',
                  'read': false,
                  'applicationId': applicationId,
                  'jobId': job.id,
                  'jobTitle': job.title,
                  'createdAt': DateTime.now().toUtc(),
                });

                try {
                  await FirebaseFirestore.instance
                      .collection('applications')
                      .doc(applicationId)
                      .set({
                    'jobId': job.id,
                    'jobTitle': job.title,
                    'role': job.title,
                    'department': job.department,
                    'location': job.location,
                    'userId': profile.id,
                    'candidateName': profile.name,
                    'candidateEmail': profile.email,
                    'candidatePhotoUrl': candidatePhotoUrl,
                    'cvUrl': downloadUrl,
                    'cvFileName': selectedPdf!.name,
                    'jobSkills': job.skills,
                    'status': 'Applied',
                    'aiStatus': 'completed',
                    'aiProvider': analysis.provider,
                    'recommendation': analysis.recommendation,
                    'score': analysis.aiScore,
                    'aiScore': analysis.aiScore,
                    'matchingScore': analysis.matchingScore,
                    'aiSummary': analysis.aiSummary,
                    'extractedSkills': analysis.extractedSkills,
                    'skillGaps': analysis.skillGaps,
                    'matchedRequirements': analysis.matchedRequirements,
                    'strengths': analysis.strengths,
                    'risks': analysis.risks,
                    'interviewQuestions': analysis.interviewQuestions,
                    'cvTextPreview': analysis.cvTextPreview,
                    'createdAt': FieldValue.serverTimestamp(),
                  });

                  await FirebaseFirestore.instance
                      .collection('notifications')
                      .doc('hr')
                      .collection('items')
                      .add({
                    'title': 'Nouvelle candidature reçue',
                    'message':
                        '${profile.name} a envoye son CV pour ${job.title}. Analyse IA: ${analysis.matchingScore}% (${analysis.recommendation}).',
                    'type': 'application',
                    'read': false,
                    'candidateName': profile.name,
                    'candidateEmail': profile.email,
                    'candidatePhotoUrl': candidatePhotoUrl,
                    'jobId': job.id,
                    'jobTitle': job.title,
                    'cvFileName': selectedPdf!.name,
                    'createdAt': FieldValue.serverTimestamp(),
                  });

                  await FirebaseFirestore.instance
                      .collection('notifications')
                      .doc(profile.id)
                      .collection('items')
                      .add({
                    'title': 'Votre CV a été envoyé',
                    'message':
                        'Votre CV a été envoyé avec succès pour ${job.title}.',
                    'type': 'application',
                    'read': false,
                    'createdAt': FieldValue.serverTimestamp(),
                  });
                } catch (_) {
                  // La candidature est deja synchronisee cote RH via l'API web.
                }

                if (sheetContext.mounted) {
                  Navigator.of(sheetContext).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        backgroundColor: const Color(0xFF22C55E),
                        behavior: SnackBarBehavior.floating,
                        content: Text(
                            'Votre CV est envoye avec succes pour ${job.title}.')),
                  );
                }
              } on FirebaseException catch (error) {
                if (sheetContext.mounted) {
                  ScaffoldMessenger.of(sheetContext).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Echec d envoi du CV: ${error.code} ${error.message ?? ""}',
                      ),
                    ),
                  );
                }
              } catch (error) {
                if (sheetContext.mounted) {
                  ScaffoldMessenger.of(sheetContext).showSnackBar(
                    SnackBar(content: Text('Echec d envoi: $error')),
                  );
                }
              } finally {
                if (sheetContext.mounted) {
                  setSheetState(() {
                    submitting = false;
                  });
                }
              }
            }

            return Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20,
                  MediaQuery.of(sheetContext).viewInsets.bottom + 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(job.title,
                      style: const TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(job.description,
                      style: TextStyle(color: Colors.grey.shade700)),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: submitting
                        ? null
                        : () async {
                            final picked = await _pickPdf();
                            if (picked == null) return;
                            setSheetState(() {
                              selectedPdf = picked;
                            });
                          },
                    icon: const Icon(Icons.picture_as_pdf_outlined),
                    label: Text(selectedPdf == null
                        ? 'Choisir un CV PDF'
                        : selectedPdf!.name),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(54),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    selectedPdf == null
                        ? 'Le RH pourra telecharger ce PDF depuis la fiche candidat.'
                        : 'Le CV sera envoye a RH puis analyse automatiquement.',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: submitting ? null : handleSubmit,
                    icon: submitting
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.send),
                    label: Text(submitting
                        ? 'Envoi en cours...'
                        : 'Envoyer ma candidature'),
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(54),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: webApplicationsStream(profile.id),
      builder: (context, applicationSnapshot) {
        final appliedJobIds = (applicationSnapshot.data ?? [])
            .map((application) => application['jobId']?.toString())
            .whereType<String>()
            .toSet();

        return StreamBuilder<List<JobOffer>>(
          stream: webPublishedJobsStream(),
          builder: (context, snapshot) {
            final jobs = snapshot.data ?? [];
            final error = snapshot.error?.toString();

            return Stack(
              fit: StackFit.expand,
              children: [
                Image.asset(
                  'assets/jobs-background.png',
                  fit: BoxFit.cover,
                  alignment: Alignment.topCenter,
                ),
                ListView(
                  padding: const EdgeInsets.fromLTRB(18, 210, 18, 18),
                  children: [
                    JobsCountCard(count: jobs.length),
                    const SizedBox(height: 25),
                    if (snapshot.connectionState == ConnectionState.waiting)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: CircularProgressIndicator(
                            color: Color(0xFF6B3BFF),
                          ),
                        ),
                      )
                    else if (error != null)
                      InfoCard(
                        icon: Icons.error_outline,
                        title: 'Offres indisponibles',
                        subtitle: error,
                      )
                    else if (jobs.isEmpty)
                      const InfoCard(
                        icon: Icons.work_outline,
                        title: 'Aucune offre publiée',
                        subtitle:
                            'Ajoutez une offre dans le dashboard web pour la voir ici.',
                      )
                    else
                      ...jobs.asMap().entries.map(
                            (entry) => Padding(
                              padding: const EdgeInsets.only(bottom: 13),
                              child: JobOfferCard(
                                job: entry.value,
                                index: entry.key,
                                alreadyApplied:
                                    appliedJobIds.contains(entry.value.id),
                                onApply: () => _apply(context, entry.value),
                              ),
                            ),
                          ),
                    const SizedBox(height: 6),
                  ],
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class SpontaneousTab extends StatefulWidget {
  const SpontaneousTab({super.key, required this.profile});

  final CandidateProfile profile;

  @override
  State<SpontaneousTab> createState() => _SpontaneousTabState();
}

class _SpontaneousTabState extends State<SpontaneousTab> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();
  PickedPdf? _pdf;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _messageController.addListener(_refreshMessageCount);
  }

  @override
  void dispose() {
    _messageController.removeListener(_refreshMessageCount);
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _refreshMessageCount() {
    setState(() {});
  }

  Future<void> _pickPdf() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf'],
      withData: true,
    );
    final file = result?.files.single;
    if (file == null || file.bytes == null) return;
    setState(() {
      _pdf = PickedPdf(bytes: file.bytes!, name: file.name);
    });
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_pdf == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Veuillez ajouter un CV PDF.')));
      return;
    }

    try {
      setState(() {
        _submitting = true;
      });
      final downloadUrl =
          await JobsTab(profile: widget.profile)._uploadPdfToStorage(
        folder: 'spontaneous',
        candidateId: widget.profile.id,
        pdf: _pdf!,
      );
      final candidatePhotoUrl = await getCandidateProfilePhotoUrl(
          widget.profile.id, widget.profile.photoUrl);

      await createWebFirestoreDocument('spontaneous', {
        'userId': widget.profile.id,
        'email': _emailController.text.trim(),
        'candidateName': widget.profile.name,
        'candidateEmail': widget.profile.email,
        'candidatePhotoUrl': candidatePhotoUrl,
        'cvUrl': downloadUrl,
        'cvFileName': _pdf!.name,
        'description': _messageController.text.trim(),
        'status': 'New',
        'createdAt': DateTime.now().toUtc(),
      });

      await createWebFirestoreDocument('notifications/hr/items', {
        'title': 'Nouvelle candidature spontanee',
        'message': '${widget.profile.name} a envoye un CV spontane.',
        'type': 'application',
        'read': false,
        'candidateName': widget.profile.name,
        'candidateEmail': widget.profile.email,
        'candidatePhotoUrl': candidatePhotoUrl,
        'cvFileName': _pdf!.name,
        'createdAt': DateTime.now().toUtc(),
      });

      await createWebFirestoreDocument(
          'notifications/${widget.profile.id}/items', {
        'title': 'Votre CV a ete envoye',
        'message': 'Votre CV a ete envoye avec succes a l entreprise.',
        'type': 'application',
        'read': false,
        'createdAt': DateTime.now().toUtc(),
      });

      try {
        await FirebaseFirestore.instance
            .collection('notifications')
            .doc('hr')
            .collection('items')
            .add({
          'title': 'Nouvelle candidature spontanee',
          'message': '${widget.profile.name} a envoyé un CV spontané.',
          'type': 'application',
          'read': false,
          'candidateName': widget.profile.name,
          'candidateEmail': widget.profile.email,
          'candidatePhotoUrl': candidatePhotoUrl,
          'cvFileName': _pdf!.name,
          'createdAt': FieldValue.serverTimestamp(),
        });

        await FirebaseFirestore.instance
            .collection('notifications')
            .doc(widget.profile.id)
            .collection('items')
            .add({
          'title': 'Votre CV a été envoyé',
          'message': 'Votre CV a été envoyé avec succès à l entreprise.',
          'type': 'application',
          'read': false,
          'createdAt': FieldValue.serverTimestamp(),
        });
      } catch (_) {
        // La candidature spontanee est deja synchronisee cote RH via l'API web.
      }

      if (!mounted) return;
      _emailController.clear();
      _messageController.clear();
      setState(() {
        _pdf = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF22C55E),
          behavior: SnackBarBehavior.floating,
          content: Text('Votre CV est envoye avec succes.'),
        ),
      );
    } on FirebaseException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                'Echec d envoi du CV: ${error.code} ${error.message ?? ""}')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Echec d envoi: $error')));
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final messageLength = _messageController.text.length;

    return Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFFF8FAFF),
                Color(0xFFF1F3FF),
                Color(0xFFFFFFFF),
              ],
            ),
          ),
        ),
        Positioned(
          top: -40,
          right: -50,
          child: Container(
            width: 230,
            height: 230,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF8B7CFF).withAlpha(26),
            ),
          ),
        ),
        ListView(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 24),
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Material(
                color: Colors.white.withAlpha(238),
                borderRadius: BorderRadius.circular(17),
                child: InkWell(
                  onTap: () => Navigator.of(context).maybePop(),
                  borderRadius: BorderRadius.circular(17),
                  child: const SizedBox(
                    width: 55,
                    height: 55,
                    child: Icon(Icons.arrow_back,
                        color: Color(0xFF6548FF), size: 30),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Candidature',
                        style: TextStyle(
                          color: Color(0xFF080D3D),
                          fontSize: 34,
                          height: 1.02,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Color(0xFF9B72FF), Color(0xFF3D6EFF)],
                        ).createShader(bounds),
                        child: const Text(
                          'spontanee',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 39,
                            height: 1.02,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      const Text(
                        'Envoyez votre candidature et\nrejoignez notre equipe',
                        style: TextStyle(
                          color: Color(0xFF535979),
                          fontSize: 17,
                          height: 1.45,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                SizedBox(
                  width: 162,
                  height: 150,
                  child: Image.asset(
                    'assets/spontaneous-hero.png',
                    fit: BoxFit.contain,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 30),
            Container(
              padding: const EdgeInsets.fromLTRB(18, 24, 18, 24),
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(248),
                borderRadius: BorderRadius.circular(29),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF9AA7C8).withAlpha(25),
                    blurRadius: 32,
                    offset: const Offset(0, 15),
                  ),
                ],
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SpontaneousFieldLabel(
                      icon: Icons.mail_outline,
                      iconColor: Color(0xFF6248FF),
                      iconBackground: Color(0xFFF1EEFF),
                      label: 'Email professionnel',
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: spontaneousInputDecoration(
                        'exemple@entreprise.com',
                      ),
                      validator: (value) =>
                          value == null || !value.contains('@')
                              ? 'Email valide requis.'
                              : null,
                    ),
                    const SizedBox(height: 25),
                    const SpontaneousFieldLabel(
                      icon: Icons.picture_as_pdf,
                      iconColor: Color(0xFF31B991),
                      iconBackground: Color(0xFFE6FAF2),
                      label: 'CV (PDF uniquement)',
                    ),
                    const SizedBox(height: 10),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _submitting ? null : _pickPdf,
                        borderRadius: BorderRadius.circular(18),
                        child: Container(
                          height: 150,
                          padding: const EdgeInsets.symmetric(horizontal: 18),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFCFDFF),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: const Color(0xFFE1E5F0),
                              width: 1.3,
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                height: 51,
                                width: 51,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDDF7EC),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.upload_outlined,
                                    color: Color(0xFF40B997), size: 31),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _pdf == null ? 'Ajouter un CV PDF' : _pdf!.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Color(0xFF49BCAF),
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _pdf == null
                                    ? 'Seuls les fichiers PDF sont acceptes.'
                                    : 'PDF pret a etre envoye.',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  color: Color(0xFF555B7B),
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 25),
                    const SpontaneousFieldLabel(
                      icon: Icons.chat_bubble_outline,
                      iconColor: Color(0xFFF6A000),
                      iconBackground: Color(0xFFFFF4DC),
                      label: 'Message de motivation',
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _messageController,
                      minLines: 5,
                      maxLines: 6,
                      maxLength: 1000,
                      decoration: spontaneousInputDecoration(
                        'Parlez-nous de vous, de votre motivation et\nde ce que vous pouvez apporter a notre equipe...',
                        counterText: '$messageLength/1000',
                      ),
                      validator: (value) =>
                          value == null || value.trim().isEmpty
                              ? 'Champ requis.'
                              : null,
                    ),
                    const SizedBox(height: 20),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF8B5CFF), Color(0xFF4B24FF)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF5F3BFF).withAlpha(55),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: _submitting ? null : _submit,
                          borderRadius: BorderRadius.circular(20),
                          child: SizedBox(
                            height: 64,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _submitting
                                    ? const SizedBox(
                                        height: 21,
                                        width: 21,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.3,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Icon(Icons.send,
                                        color: Colors.white, size: 31),
                                const SizedBox(width: 15),
                                Text(
                                  _submitting
                                      ? 'Envoi en cours...'
                                      : 'Envoyer ma candidature',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class SpontaneousFieldLabel extends StatelessWidget {
  const SpontaneousFieldLabel({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
    required this.label,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 48,
          width: 48,
          decoration: BoxDecoration(
            color: iconBackground,
            borderRadius: BorderRadius.circular(15),
          ),
          child: Icon(icon, color: iconColor, size: 27),
        ),
        const SizedBox(width: 15),
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF080D3D),
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ],
    );
  }
}

InputDecoration spontaneousInputDecoration(
  String hint, {
  String? counterText,
}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(
      color: Color(0xFF8D95AE),
      fontSize: 16,
      height: 1.35,
      fontWeight: FontWeight.w500,
    ),
    counterText: counterText,
    counterStyle: const TextStyle(
      color: Color(0xFF868EA5),
      fontSize: 14,
      fontWeight: FontWeight.w700,
    ),
    filled: true,
    fillColor: const Color(0xFFFCFDFF),
    contentPadding: const EdgeInsets.symmetric(horizontal: 19, vertical: 19),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: Color(0xFFE1E5F0), width: 1.2),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: Color(0xFFE1E5F0), width: 1.2),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: Color(0xFF7B61FF), width: 1.4),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: Color(0xFFBE123C), width: 1.2),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(20),
      borderSide: const BorderSide(color: Color(0xFFBE123C), width: 1.4),
    ),
  );
}

class NotificationsTab extends StatelessWidget {
  const NotificationsTab({super.key, required this.profile});

  final CandidateProfile profile;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: webNotificationsStream(profile.id),
      builder: (context, snapshot) {
        final notifications = snapshot.data ?? [];
        final unreadNotifications =
            notifications.where((item) => item['read'] != true).toList();
        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                const Expanded(
                    child: Text('Notifications',
                        style: TextStyle(
                            fontSize: 26, fontWeight: FontWeight.w800))),
                if (unreadNotifications.isNotEmpty)
                  TextButton(
                    onPressed: () async {
                      for (final notification in unreadNotifications) {
                        await markWebNotificationRead(
                            profile.id, notification['id'].toString());
                      }
                    },
                    child: const Text('Tout lire'),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (notifications.isEmpty)
              const InfoCard(
                icon: Icons.notifications_none,
                title: 'Aucune notification',
                subtitle: 'Les retours RH apparaitront ici.',
              )
            else
              ...notifications.map((data) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: NotificationTile(
                    title: data['title']?.toString() ?? 'Notification',
                    message: data['message']?.toString() ?? '',
                    isRead: data['read'] == true,
                    onTap: () async {
                      await markWebNotificationRead(
                          profile.id, data['id'].toString());
                      final applicationId = data['applicationId']?.toString();
                      if (applicationId == null ||
                          applicationId.isEmpty ||
                          !context.mounted) {
                        return;
                      }

                      final applications =
                          await fetchWebApplications(profile.id);
                      final matches = applications
                          .where(
                              (item) => item['id']?.toString() == applicationId)
                          .toList();
                      if (matches.isEmpty || !context.mounted) {
                        return;
                      }

                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => ApplicationStatusPage(
                            profile: profile,
                            applicationId: applicationId,
                            initialApplication: matches.first,
                          ),
                        ),
                      );
                    },
                  ),
                );
              }),
          ],
        );
      },
    );
  }
}

class ProfileTab extends StatefulWidget {
  const ProfileTab({
    super.key,
    required this.profile,
    required this.onLogout,
  });

  final CandidateProfile profile;
  final VoidCallback onLogout;

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  late String _photoUrl;
  bool _updatingPhoto = false;

  @override
  void initState() {
    super.initState();
    _photoUrl = widget.profile.photoUrl;
  }

  Future<void> _updateProfileImage(BuildContext context) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        withData: true,
      );
      final file = result?.files.single;
      if (file == null || file.bytes == null) return;

      setState(() {
        _updatingPhoto = true;
      });

      final photoUrl = await uploadImageToCloudinary(
        candidateId: widget.profile.id,
        bytes: file.bytes!,
        fileName: file.name,
      );

      await FirebaseAuth.instance.currentUser?.updatePhotoURL(photoUrl);

      if (mounted) {
        setState(() {
          _photoUrl = photoUrl;
        });
      }

      try {
        await FirebaseFirestore.instance
            .collection('users')
            .doc(widget.profile.id)
            .set({
          'name': widget.profile.name,
          'email': widget.profile.email,
          'role': 'candidate',
          'photoUrl': photoUrl,
          'updatedAt': FieldValue.serverTimestamp(),
        }, SetOptions(merge: true));
      } catch (_) {
        // Le lien Cloudinary est deja garde dans Firebase Auth.
      }

      try {
        final applications = await fetchWebApplications(widget.profile.id);
        for (final application in applications) {
          final applicationId = application['id']?.toString();
          if (applicationId == null || applicationId.isEmpty) continue;
          await patchWebFirestoreDocument('applications/$applicationId', {
            'candidatePhotoUrl': photoUrl,
            'updatedAt': DateTime.now().toUtc(),
          });
        }
      } catch (_) {
        // Les prochaines candidatures porteront quand meme la photo.
      }

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo stockee dans Cloudinary.')));
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload image impossible: $error')));
    } finally {
      if (mounted) {
        setState(() {
          _updatingPhoto = false;
        });
      }
    }
  }

  Widget _buildProfileDesign(int applicationsCount, int waitingCount) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 24, 18, 28),
      children: [
        Row(
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Mon profil',
                    style: TextStyle(
                      color: Color(0xFF07154C),
                      fontSize: 35,
                      height: 1,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 14),
                  Text(
                    'Gérez vos informations personnelles',
                    style: TextStyle(
                      color: Color(0xFF5F6887),
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              height: 76,
              width: 76,
              decoration: BoxDecoration(
                color: Colors.white.withAlpha(242),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF7C8AA7).withAlpha(24),
                    blurRadius: 24,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: const Icon(Icons.settings_outlined,
                  color: Color(0xFF7C4DFF), size: 34),
            ),
          ],
        ),
        const SizedBox(height: 44),
        Container(
          padding: const EdgeInsets.fromLTRB(16, 42, 16, 18),
          decoration: BoxDecoration(
            color: Colors.white.withAlpha(240),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF94A3B8).withAlpha(28),
                blurRadius: 34,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: Column(
            children: [
              Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Container(
                    height: 132,
                    width: 132,
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [
                          Color(0xFF7B61FF),
                          Color(0xFFE05CFF),
                          Color(0xFF70D9F7),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: CircleAvatar(
                      backgroundColor: Colors.white,
                      child: CircleAvatar(
                        radius: 58,
                        backgroundColor: const Color(0xFFEDE9FE),
                        backgroundImage:
                            _photoUrl.isEmpty ? null : NetworkImage(_photoUrl),
                        child: _photoUrl.isEmpty
                            ? Text(
                                widget.profile.name
                                    .substring(0, 1)
                                    .toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF6B3BFF),
                                ),
                              )
                            : null,
                      ),
                    ),
                  ),
                  Positioned(
                    right: -4,
                    bottom: 10,
                    child: InkWell(
                      onTap: _updatingPhoto
                          ? null
                          : () => _updateProfileImage(context),
                      borderRadius: BorderRadius.circular(999),
                      child: Container(
                        height: 52,
                        width: 52,
                        decoration: BoxDecoration(
                          color: const Color(0xFF6B3BFF),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 4),
                        ),
                        child: _updatingPhoto
                            ? const Padding(
                                padding: EdgeInsets.all(14),
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.photo_camera,
                                color: Colors.white, size: 25),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Text(
                widget.profile.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF07154C),
                  fontSize: 32,
                  height: 1,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFE8FF),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.work, color: Color(0xFF7C4DFF), size: 18),
                    SizedBox(width: 9),
                    Text(
                      'Candidat',
                      style: TextStyle(
                        color: Color(0xFF7C4DFF),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Text(
                widget.profile.email,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF5F6887),
                  fontSize: 16.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 28),
              OutlinedButton.icon(
                onPressed:
                    _updatingPhoto ? null : () => _updateProfileImage(context),
                icon: const Icon(Icons.photo_camera_outlined),
                label: Text(_updatingPhoto
                    ? 'Upload...'
                    : _photoUrl.isEmpty
                        ? 'Ajouter ma photo'
                        : 'Changer ma photo'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 60),
                  padding: const EdgeInsets.symmetric(horizontal: 34),
                  foregroundColor: const Color(0xFF7C4DFF),
                  side: const BorderSide(color: Color(0xFF7C4DFF), width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(28),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(height: 34),
              Row(
                children: [
                  Expanded(
                    child: ProfileMetricCard(
                      value: applicationsCount.toString(),
                      title: 'Candidatures',
                      subtitle: 'Postulations envoyées',
                      icon: Icons.business_center,
                      color: const Color(0xFF2196F3),
                      softColor: const Color(0xFFEAF5FF),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ProfileMetricCard(
                      value: waitingCount.toString(),
                      title: 'En attente',
                      subtitle: 'Réponses en attente',
                      icon: Icons.schedule,
                      color: const Color(0xFF18BF62),
                      softColor: const Color(0xFFE9FBF0),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 26),
        OutlinedButton.icon(
          onPressed: widget.onLogout,
          icon: const Icon(Icons.logout, size: 30),
          label: const Text('Se déconnecter'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(68),
            foregroundColor: const Color(0xFFEF3E4A),
            side: BorderSide(color: const Color(0xFFE9DDFB).withAlpha(210)),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            textStyle: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: webApplicationsStream(widget.profile.id),
      builder: (context, snapshot) {
        final applications = snapshot.data ?? [];
        final waiting = applications
            .where((application) =>
                (application['status']?.toString() ?? 'Applied') == 'Applied')
            .length;
        if (DateTime.now().microsecondsSinceEpoch >= 0) {
          return _buildProfileDesign(applications.length, waiting);
        }

        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const SizedBox(height: 8),
            const Text('Mon profil',
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
            const SizedBox(height: 18),
            Card(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 38,
                      backgroundColor: const Color(0xFFEDE9FE),
                      backgroundImage:
                          _photoUrl.isEmpty ? null : NetworkImage(_photoUrl),
                      child: _photoUrl.isEmpty
                          ? Text(
                              widget.profile.name.substring(0, 1).toUpperCase(),
                              style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF4F46E5)),
                            )
                          : null,
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: _updatingPhoto
                          ? null
                          : () => _updateProfileImage(context),
                      icon: _updatingPhoto
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.photo_camera_outlined),
                      label: Text(_updatingPhoto
                          ? 'Upload...'
                          : _photoUrl.isEmpty
                              ? 'Ajouter ma photo'
                              : 'Changer ma photo'),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(widget.profile.name,
                        style: const TextStyle(
                            fontSize: 22, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(widget.profile.email,
                        style: TextStyle(color: Colors.grey.shade600)),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                            child: StatCard(
                                label: 'Candidatures',
                                value: applications.length.toString())),
                        const SizedBox(width: 12),
                        Expanded(
                            child: StatCard(
                                label: 'En attente',
                                value: waiting.toString())),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),
            OutlinedButton.icon(
              onPressed: widget.onLogout,
              icon: const Icon(Icons.logout),
              label: const Text('Se deconnecter'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
                foregroundColor: const Color(0xFFDC2626),
                side: const BorderSide(color: Color(0xFFDC2626)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18)),
              ),
            ),
          ],
        );
      },
    );
  }
}

class ProfileMetricCard extends StatelessWidget {
  const ProfileMetricCard({
    super.key,
    required this.value,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.softColor,
  });

  final String value;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Color softColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 168,
      padding: const EdgeInsets.fromLTRB(15, 18, 12, 15),
      decoration: BoxDecoration(
        color: softColor,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: color.withAlpha(35),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 27),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF07154C),
              fontSize: 34,
              height: 1,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF07154C),
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF5F6887),
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class ActionCard extends StatelessWidget {
  const ActionCard({
    super.key,
    required this.assetPath,
    required this.label,
    required this.onTap,
  });

  final String assetPath;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Semantics(
        button: true,
        label: label,
        child: AspectRatio(
          aspectRatio: 347 / 278,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Image.asset(
              assetPath,
              fit: BoxFit.cover,
              filterQuality: FilterQuality.high,
            ),
          ),
        ),
      ),
    );
  }
}

class NotificationBubble extends StatelessWidget {
  const NotificationBubble(
      {super.key, required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            height: 54,
            width: 54,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withAlpha(238),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF94A3B8).withAlpha(24),
                  blurRadius: 22,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const Icon(Icons.notifications_none,
                color: Color(0xFF111636), size: 27),
          ),
          Positioned(
            right: -1,
            top: -1,
            child: count > 0
                ? BadgeDot(count: count)
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

class ViewAllPill extends StatelessWidget {
  const ViewAllPill({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.fromLTRB(13, 9, 11, 9),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(232),
          borderRadius: BorderRadius.circular(999),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF94A3B8).withAlpha(22),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.grid_view_rounded, color: Color(0xFF111636), size: 17),
            SizedBox(width: 9),
            Text(
              'Voir tout',
              style: TextStyle(
                color: Color(0xFF070C34),
                fontSize: 14,
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(width: 8),
            Icon(Icons.chevron_right, color: Color(0xFF111636), size: 21),
          ],
        ),
      ),
    );
  }
}

class InfoCard extends StatelessWidget {
  const InfoCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          children: [
            Icon(icon, size: 36, color: const Color(0xFF4F46E5)),
            const SizedBox(height: 12),
            Text(title,
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade600)),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 12),
              TextButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

String applicationStatusLabel(Map<String, dynamic> application) {
  if (application['interviewStatus']?.toString() == 'submitted') {
    return 'Interview envoyee';
  }

  switch (application['status']?.toString()) {
    case 'Interview':
      return 'Interview';
    case 'Accepted':
      return 'Accepter';
    case 'Rejected':
      return 'Reject';
    case 'Offered':
      return 'Offre';
    case 'Reviewed':
    case 'Applied':
    default:
      return 'Pending';
  }
}

Color applicationStatusColor(Map<String, dynamic> application) {
  switch (application['status']?.toString()) {
    case 'Interview':
      return const Color(0xFFF59E0B);
    case 'Accepted':
    case 'Offered':
      return const Color(0xFF10B981);
    case 'Rejected':
      return const Color(0xFFEF4444);
    default:
      return const Color(0xFF6B7280);
  }
}

int applicationStatusIndex(Map<String, dynamic> application) {
  switch (application['status']?.toString()) {
    case 'Interview':
      return 1;
    case 'Accepted':
    case 'Offered':
    case 'Rejected':
      return 2;
    default:
      return 0;
  }
}

List<String> applicationStatusSteps(Map<String, dynamic> application) {
  final status = application['status']?.toString();
  final decisionLabel = status == 'Accepted' || status == 'Offered'
      ? 'Accepter'
      : status == 'Rejected'
          ? 'Reject'
          : 'Accepter / Reject';
  return ['Pending', 'Interview', decisionLabel];
}

List<String> applicationInterviewQuestions(Map<String, dynamic> application) {
  final questions = normalizeStringList(application['interviewQuestions']);
  if (questions.isNotEmpty) return questions;
  return const [
    'Presentez une experience recente qui montre votre impact dans ce poste.',
    'Comment organisez-vous votre travail quand les priorites changent rapidement ?',
    'Quelles competences voulez-vous renforcer pendant les 90 premiers jours ?',
  ];
}

class ApplicationStatusPage extends StatelessWidget {
  const ApplicationStatusPage({
    super.key,
    required this.profile,
    required this.applicationId,
    required this.initialApplication,
  });

  final CandidateProfile profile;
  final String applicationId;
  final Map<String, dynamic> initialApplication;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: webApplicationsStream(profile.id),
        builder: (context, snapshot) {
          final matches = (snapshot.data ?? [])
              .where((item) => item['id']?.toString() == applicationId)
              .toList();
          final application =
              matches.isEmpty ? initialApplication : matches.first;
          final statusIndex = applicationStatusIndex(application);
          final statusColor = applicationStatusColor(application);
          final canAnswerInterview =
              application['status']?.toString() == 'Interview' &&
                  application['interviewStatus']?.toString() != 'submitted';

          return Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                'assets/application-status-background.png',
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
              ),
              SafeArea(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final height = constraints.maxHeight;
                    final progressTop = height * 0.29;
                    final resultTop = height * 0.61;

                    return Stack(
                      children: [
                        Positioned(
                          left: 14,
                          right: 14,
                          top: progressTop,
                          height: height * 0.30,
                          child: ApplicationProgressCard(
                            application: application,
                            statusIndex: statusIndex,
                            statusColor: statusColor,
                          ),
                        ),
                        Positioned(
                          left: 14,
                          right: 14,
                          top: resultTop,
                          height: height * 0.31,
                          child: ApplicationResultCard(
                            application: application,
                            statusColor: statusColor,
                            canAnswerInterview: canAnswerInterview,
                            onAnswerInterview: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => InterviewAnswerPage(
                                  profile: profile,
                                  application: application,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              Positioned(
                left: 18,
                right: 18,
                top: MediaQuery.paddingOf(context).top + 8,
                child: Row(
                  children: [
                    InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        height: 54,
                        width: 54,
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(238),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF7C8AA7).withAlpha(16),
                              blurRadius: 18,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.arrow_back,
                            color: Color(0xFF5A31FF), size: 28),
                      ),
                    ),
                    const SizedBox(width: 20),
                    const Expanded(
                      child: Text(
                        'Statut candidature',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Color(0xFF070C34),
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class ApplicationProgressCard extends StatelessWidget {
  const ApplicationProgressCard({
    super.key,
    required this.application,
    required this.statusIndex,
    required this.statusColor,
  });

  final Map<String, dynamic> application;
  final int statusIndex;
  final Color statusColor;

  @override
  Widget build(BuildContext context) {
    final labels = applicationStatusSteps(application);

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(238),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withAlpha(220)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C8AA7).withAlpha(20),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 42,
                width: 42,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFF0E9FF),
                ),
                child: const Icon(Icons.trending_up,
                    color: Color(0xFF6B3BFF), size: 24),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Où en est votre offre ?',
                      style: TextStyle(
                        color: Color(0xFF070C34),
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 5),
                    Text(
                      "Suivez l'avancement de votre candidature",
                      style: TextStyle(
                        color: Color(0xFF7B7F9D),
                        fontSize: 10.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: List.generate(labels.length, (index) {
                final active = index == statusIndex;
                final complete = index < statusIndex;
                final color = active
                    ? statusColor
                    : complete
                        ? const Color(0xFF6B3BFF)
                        : const Color(0xFFECE9FA);

                return Expanded(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  height: active ? 54 : 48,
                                  width: active ? 54 : 48,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: color.withAlpha(active ? 80 : 42),
                                      width: active ? 4 : 2,
                                    ),
                                  ),
                                ),
                                Container(
                                  height: active ? 40 : 36,
                                  width: active ? 40 : 36,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: active
                                        ? color
                                        : const Color(0xFFF0EEFA),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '${index + 1}',
                                    style: TextStyle(
                                      color: active
                                          ? Colors.white
                                          : const Color(0xFF1D2248),
                                      fontSize: active ? 18 : 14,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 9),
                            Text(
                              labels[index],
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: active ? color : const Color(0xFF6B6F90),
                                fontSize: 10.5,
                                fontWeight:
                                    active ? FontWeight.w900 : FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 7),
                            Container(
                              height: 20,
                              width: 20,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: color.withAlpha(active ? 54 : 32),
                              ),
                              child: Icon(
                                index == 0
                                    ? Icons.schedule
                                    : index == 1
                                        ? Icons.person_outline
                                        : Icons.check_circle_outline,
                                color: color,
                                size: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (index < labels.length - 1)
                        Expanded(
                          child: Container(
                            height: 3,
                            margin: const EdgeInsets.only(top: 26),
                            decoration: BoxDecoration(
                              color: index < statusIndex
                                  ? (index == 1
                                      ? statusColor
                                      : const Color(0xFF6B3BFF))
                                  : const Color(0xFFE7E4F5),
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

class ApplicationResultCard extends StatelessWidget {
  const ApplicationResultCard({
    super.key,
    required this.application,
    required this.statusColor,
    required this.canAnswerInterview,
    required this.onAnswerInterview,
  });

  final Map<String, dynamic> application;
  final Color statusColor;
  final bool canAnswerInterview;
  final VoidCallback onAnswerInterview;

  @override
  Widget build(BuildContext context) {
    final label = applicationStatusLabel(application);
    final isPositive = application['status']?.toString() == 'Accepted' ||
        application['status']?.toString() == 'Offered';
    final isRejected = application['status']?.toString() == 'Rejected';
    final title = isPositive
        ? 'Offre'
        : isRejected
            ? 'Candidature non retenue'
            : canAnswerInterview
                ? 'Entretien'
                : label;
    final message = application['interviewStatus']?.toString() == 'submitted'
        ? "Vos réponses sont arrivées chez l'équipe RH."
        : canAnswerInterview
            ? "L'équipe RH vous invite à répondre aux questions d'entretien."
            : isRejected
                ? "Votre candidature n'a pas été retenue pour cette offre."
                : isPositive
                    ? 'Votre candidature a reçu\nune suite favorable.'
                    : "Votre candidature est en cours de traitement par l'équipe RH.";

    return Container(
      padding: const EdgeInsets.fromLTRB(22, 26, 22, 22),
      decoration: BoxDecoration(
        color: (isPositive ? const Color(0xFFEFFCF6) : const Color(0xFFFFFFFF))
            .withAlpha(238),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: (isPositive ? const Color(0xFFC9F3DF) : Colors.white)
              .withAlpha(220),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C8AA7).withAlpha(18),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 132,
            width: 132,
            decoration: BoxDecoration(
              color: statusColor.withAlpha(28),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Icon(
              isRejected
                  ? Icons.cancel_outlined
                  : canAnswerInterview
                      ? Icons.question_answer_outlined
                      : Icons.verified_user,
              color: statusColor,
              size: 74,
            ),
          ),
          const SizedBox(width: 22),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(30),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    isPositive ? 'Félicitations ! 🎉' : label,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 12.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 29,
                    height: 1,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Container(
                  height: 4,
                  width: 54,
                  margin: const EdgeInsets.only(top: 16, bottom: 16),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(120),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                Text(
                  message,
                  style: const TextStyle(
                    color: Color(0xFF111636),
                    fontSize: 16,
                    height: 1.42,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 18),
                InkWell(
                  onTap: canAnswerInterview ? onAnswerInterview : null,
                  borderRadius: BorderRadius.circular(15),
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(15, 13, 11, 13),
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(118),
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: statusColor.withAlpha(36)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.description, color: statusColor, size: 29),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            canAnswerInterview
                                ? "Répondre aux questions d'entretien"
                                : 'Nous vous contacterons bientôt\npour les prochaines étapes.',
                            style: const TextStyle(
                              color: Color(0xFF111636),
                              fontSize: 14.5,
                              height: 1.25,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Icon(Icons.chevron_right, color: statusColor, size: 28),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class InterviewAnswerPage extends StatefulWidget {
  const InterviewAnswerPage({
    super.key,
    required this.profile,
    required this.application,
  });

  final CandidateProfile profile;
  final Map<String, dynamic> application;

  @override
  State<InterviewAnswerPage> createState() => _InterviewAnswerPageState();
}

class _InterviewAnswerPageState extends State<InterviewAnswerPage> {
  late final List<String> _questions;
  late final List<TextEditingController> _controllers;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _questions = applicationInterviewQuestions(widget.application);
    _controllers = _questions.map((_) => TextEditingController()).toList();
  }

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final answers = <Map<String, dynamic>>[];
    for (var index = 0; index < _questions.length; index++) {
      final answer = _controllers[index].text.trim();
      if (answer.isNotEmpty) {
        answers.add({
          'question': _questions[index],
          'answer': answer,
        });
      }
    }

    if (answers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Veuillez repondre au moins a une question.')));
      return;
    }

    setState(() {
      _submitting = true;
    });

    try {
      final applicationId = widget.application['id'].toString();
      await patchWebFirestoreDocument('applications/$applicationId', {
        'interviewAnswers': answers,
        'interviewStatus': 'submitted',
        'interviewSubmittedAt': DateTime.now().toUtc(),
        'updatedAt': DateTime.now().toUtc(),
      });

      await createWebFirestoreDocument('notifications/hr/items', {
        'title': 'Entretien soumis',
        'message':
            '${widget.profile.name} a repondu aux questions pour ${widget.application['jobTitle'] ?? widget.application['role'] ?? 'une offre'}.',
        'type': 'interview_submitted',
        'applicationId': applicationId,
        'candidateName': widget.profile.name,
        'candidateEmail': widget.profile.email,
        'jobTitle': widget.application['jobTitle'] ??
            widget.application['role'] ??
            'Offre',
        'read': false,
        'createdAt': DateTime.now().toUtc(),
      });

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Vos reponses ont ete envoyees au RH.')));
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Envoi impossible: $error')));
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Entretien')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
              widget.application['jobTitle']?.toString() ??
                  widget.application['role']?.toString() ??
                  'Offre',
              style:
                  const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text('Repondez aux questions. Les reponses seront visibles cote RH.',
              style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 18),
          ...List.generate(_questions.length, (index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Card(
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(22)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Question ${index + 1}',
                          style: const TextStyle(
                              color: Color(0xFF4F46E5),
                              fontWeight: FontWeight.w800,
                              fontSize: 12)),
                      const SizedBox(height: 8),
                      Text(_questions[index],
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _controllers[index],
                        minLines: 4,
                        maxLines: 7,
                        decoration: inputDecoration('Votre reponse'),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
          FilledButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: _submitting
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.send_outlined),
            label: Text(_submitting ? 'Envoi...' : 'Envoyer mes reponses'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(54),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18)),
            ),
          ),
        ],
      ),
    );
  }
}

class ApplicationTile extends StatelessWidget {
  const ApplicationTile({
    super.key,
    required this.application,
    required this.title,
    required this.subtitle,
    required this.date,
    required this.onTap,
  });

  final Map<String, dynamic> application;
  final String title;
  final String subtitle;
  final String date;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final statusColor = applicationStatusColor(application);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(244),
        borderRadius: BorderRadius.circular(21),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF94A3B8).withAlpha(20),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(21),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(13, 14, 14, 14),
          child: Row(
            children: [
              Container(
                height: 54,
                width: 54,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFEAFF),
                  borderRadius: BorderRadius.circular(16),
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.description_outlined,
                    color: Color(0xFF4D2FFF), size: 31),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Color(0xFF070C34),
                            fontSize: 16,
                            fontWeight: FontWeight.w900)),
                    const SizedBox(height: 5),
                    Text('$subtitle • $date',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Color(0xFF303655), fontSize: 13.5)),
                    const SizedBox(height: 8),
                    const Text('Voir le statut',
                        style: TextStyle(
                            color: Color(0xFF302DFF),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w900)),
                  ],
                ),
              ),
              const SizedBox(width: 7),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 93),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(28),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Text(subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w900)),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right,
                  color: Color(0xFF111636), size: 25),
            ],
          ),
        ),
      ),
    );
  }
}

class JobOfferCard extends StatelessWidget {
  const JobOfferCard({
    super.key,
    required this.job,
    required this.index,
    required this.alreadyApplied,
    required this.onApply,
  });

  final JobOffer job;
  final int index;
  final bool alreadyApplied;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    final palette = JobCardPalette.byIndex(index);
    final chips = job.skills.isEmpty ? <String>['communication'] : job.skills;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(246),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C8AA7).withAlpha(22),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Container(width: 4, color: palette.accent),
          ),
          Positioned(
            right: 32,
            top: 70,
            child: DottedPatch(color: palette.accent.withAlpha(60)),
          ),
          if (index % 4 == 3)
            Positioned(
              right: -18,
              bottom: -20,
              child: Container(
                height: 96,
                width: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFE7F0FF).withAlpha(210),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 56,
                  width: 56,
                  decoration: BoxDecoration(
                    color: palette.soft,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(palette.icon, color: palette.accent, size: 32),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              job.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF070C34),
                                fontSize: 19,
                                height: 1.1,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          if (index == 0) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1EAFF),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: const Text(
                                'Nouveau',
                                style: TextStyle(
                                  color: Color(0xFF6B3BFF),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(width: 32),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 13,
                        runSpacing: 7,
                        children: [
                          SmallMeta(
                              icon: Icons.business_outlined,
                              text: job.department),
                          SmallMeta(
                              icon: Icons.location_on_outlined,
                              text: job.location),
                          SmallMeta(
                              icon: Icons.schedule_outlined, text: job.type),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        job.description,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF4D5172),
                          fontSize: 14.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 13),
                      Wrap(
                        spacing: 8,
                        runSpacing: 7,
                        children: chips.take(2).map((skill) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 13, vertical: 8),
                            decoration: BoxDecoration(
                              color: palette.soft,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              skill,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: palette.accent,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 22),
                      Row(
                        children: [
                          const Icon(Icons.groups_2_outlined,
                              color: Color(0xFF596081), size: 18),
                          const SizedBox(width: 9),
                          Expanded(
                            child: Text(
                              '${job.applicants} candidature${job.applicants == 1 ? '' : 's'}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF596081),
                                fontSize: 13.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          FilledButton(
                            onPressed: alreadyApplied ? null : onApply,
                            style: FilledButton.styleFrom(
                              backgroundColor: alreadyApplied
                                  ? const Color(0xFFE5E7EB)
                                  : const Color(0xFF1169FF),
                              disabledBackgroundColor: const Color(0xFFE5E7EB),
                              disabledForegroundColor: const Color(0xFF64748B),
                              foregroundColor: Colors.white,
                              fixedSize: Size(alreadyApplied ? 132 : 116, 47),
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 13),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                              elevation: 8,
                              shadowColor:
                                  const Color(0xFF1169FF).withAlpha(82),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  alreadyApplied ? 'Déjà postulé' : 'Postuler',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                if (!alreadyApplied) ...[
                                  const SizedBox(width: 10),
                                  const Icon(Icons.arrow_forward, size: 22),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            right: 17,
            top: 17,
            child: Icon(Icons.bookmark_border, color: palette.accent, size: 29),
          ),
        ],
      ),
    );
  }
}

class JobsCountCard extends StatelessWidget {
  const JobsCountCard({super.key, required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        width: 168,
        padding: const EdgeInsets.fromLTRB(17, 16, 14, 16),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(244),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF7C8AA7).withAlpha(20),
              blurRadius: 22,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(Icons.groups_2_outlined,
                color: Color(0xFF6B3BFF), size: 30),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$count',
                    style: const TextStyle(
                      color: Color(0xFF070C34),
                      fontSize: 27,
                      height: 1,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'offres disponibles',
                    maxLines: 2,
                    style: TextStyle(
                      color: Color(0xFF8185A2),
                      fontSize: 12,
                      height: 1.1,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.trending_up, color: Color(0xFF22C58B), size: 24),
          ],
        ),
      ),
    );
  }
}

class DottedPatch extends StatelessWidget {
  const DottedPatch({super.key, required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 82,
      height: 56,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: List.generate(
          48,
          (_) => Container(
            height: 2.2,
            width: 2.2,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
        ),
      ),
    );
  }
}

class JobCardPalette {
  const JobCardPalette({
    required this.accent,
    required this.soft,
    required this.icon,
  });

  final Color accent;
  final Color soft;
  final IconData icon;

  static JobCardPalette byIndex(int index) {
    const palettes = [
      JobCardPalette(
        accent: Color(0xFF6B3BFF),
        soft: Color(0xFFF0E9FF),
        icon: Icons.code,
      ),
      JobCardPalette(
        accent: Color(0xFF17C58E),
        soft: Color(0xFFE7FAF1),
        icon: Icons.chat_bubble_outline,
      ),
      JobCardPalette(
        accent: Color(0xFFFF6B2C),
        soft: Color(0xFFFFEEE7),
        icon: Icons.campaign_outlined,
      ),
      JobCardPalette(
        accent: Color(0xFF1169FF),
        soft: Color(0xFFEAF2FF),
        icon: Icons.groups_2_outlined,
      ),
    ];
    return palettes[index % palettes.length];
  }
}

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.title,
    required this.message,
    required this.isRead,
    required this.onTap,
  });

  final String title;
  final String message;
  final bool isRead;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: isRead ? Colors.white : const Color(0xFFF5F3FF),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor:
              isRead ? const Color(0xFFE5E7EB) : const Color(0xFFEDE9FE),
          child: Icon(Icons.notifications_outlined,
              color: isRead ? Colors.grey.shade600 : const Color(0xFF4F46E5)),
        ),
        title: Text(title,
            style: TextStyle(
                fontWeight: isRead ? FontWeight.w600 : FontWeight.w800)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text(message),
        ),
      ),
    );
  }
}

class StatCard extends StatelessWidget {
  const StatCard({super.key, required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [
          Text(value,
              style:
                  const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(label,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
        ],
      ),
    );
  }
}

class SmallMeta extends StatelessWidget {
  const SmallMeta({super.key, required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: const Color(0xFF596081)),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            color: Color(0xFF596081),
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

InputDecoration inputDecoration(String label) {
  return InputDecoration(
    labelText: label,
    filled: true,
    fillColor: const Color(0xFFF8FAFC),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 1.4),
    ),
  );
}

InputDecoration glassInputDecoration(String label, IconData icon) {
  return InputDecoration(
    hintText: label,
    hintStyle: const TextStyle(
      color: Color(0xFF929BBA),
      fontSize: 17,
      fontWeight: FontWeight.w600,
    ),
    prefixIcon: Icon(icon, color: const Color(0xFF07154C), size: 28),
    prefixIconConstraints: const BoxConstraints(minWidth: 70),
    filled: true,
    fillColor: Colors.white.withAlpha(238),
    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 23),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(22),
      borderSide: BorderSide(color: const Color(0xFFE5EAF5).withAlpha(120)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(22),
      borderSide: BorderSide(color: const Color(0xFFE5EAF5).withAlpha(120)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(22),
      borderSide: const BorderSide(color: Color(0xFF3445FF), width: 1.3),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(22),
      borderSide: const BorderSide(color: Color(0xFFBE123C), width: 1.1),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(22),
      borderSide: const BorderSide(color: Color(0xFFBE123C), width: 1.3),
    ),
  );
}

String formatFirestoreDate(dynamic value) {
  if (value is Timestamp) {
    final date = value.toDate();
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
  return 'Aujourd hui';
}
