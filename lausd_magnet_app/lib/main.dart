import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const MagnetSchoolApp());
}

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

class School {
  final String name;
  final String lowGrade;
  final bool magnet;
  final String address;
  final int? quality;
  final int? access;
  final int? equity;
  final String? error;

  const School({
    required this.name,
    required this.lowGrade,
    required this.magnet,
    required this.address,
    this.quality,
    this.access,
    this.equity,
    this.error,
  });

  factory School.fromJson(Map<String, dynamic> json) => School(
        name: json['name'] as String,
        lowGrade: json['low_grade'] as String,
        magnet: json['magnet'] as bool,
        address: json['address'] as String,
        quality: json['quality'] as int?,
        access: json['access'] as int?,
        equity: json['equity'] as int?,
        error: json['error'] as String?,
      );

  String get gradesLabel {
    const highGrade = {
      'K': '5',
      '1': '5',
      '4': '5',
      '6': '8',
      '7': '8',
      '9': '12',
    };
    final hi = highGrade[lowGrade] ?? '12';
    return 'Grades $lowGrade–$hi';
  }
}

// ---------------------------------------------------------------------------
// API service
// ---------------------------------------------------------------------------

Future<List<School>> fetchSchools() async {
  final uri = Uri.parse('http://localhost:8000/schools');
  final response = await http.get(uri, headers: {'Accept': 'application/json'});

  if (response.statusCode != 200) {
    throw Exception('Server returned ${response.statusCode}: ${response.body}');
  }

  final List<dynamic> data = json.decode(response.body) as List<dynamic>;
  return data
      .map((e) => School.fromJson(e as Map<String, dynamic>))
      .toList();
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

class MagnetSchoolApp extends StatelessWidget {
  const MagnetSchoolApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LAUSD Magnet Schools',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1565C0),
          brightness: Brightness.light,
        ),
        useMaterial3: true,
        cardTheme: const CardThemeData(
          elevation: 2,
          margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ),
      home: const SchoolListPage(),
    );
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

class SchoolListPage extends StatefulWidget {
  const SchoolListPage({super.key});

  @override
  State<SchoolListPage> createState() => _SchoolListPageState();
}

class _SchoolListPageState extends State<SchoolListPage> {
  late Future<List<School>> _future;

  @override
  void initState() {
    super.initState();
    _future = fetchSchools();
  }

  void _reload() => setState(() => _future = fetchSchools());

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.surfaceContainerLowest,
      appBar: AppBar(
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        title: const Text(
          'LAUSD Magnet Schools',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: _reload,
          ),
        ],
      ),
      body: FutureBuilder<List<School>>(
        future: _future,
        builder: (context, snapshot) {
          // Loading
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading schools…'),
                ],
              ),
            );
          }

          // Error
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline,
                        size: 56, color: colorScheme.error),
                    const SizedBox(height: 16),
                    Text(
                      'Could not load schools',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(color: colorScheme.error),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      snapshot.error.toString(),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: _reload,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try again'),
                    ),
                  ],
                ),
              ),
            );
          }

          // Empty
          final schools = snapshot.data!;
          if (schools.isEmpty) {
            return const Center(child: Text('No schools found.'));
          }

          // List
          return Column(
            children: [
              // Summary bar
              Container(
                width: double.infinity,
                color: colorScheme.primaryContainer,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                child: Text(
                  '${schools.length} magnet schools',
                  style: TextStyle(
                    color: colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: schools.length,
                  itemBuilder: (context, index) =>
                      SchoolCard(school: schools[index]),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

class SchoolCard extends StatelessWidget {
  final School school;
  const SchoolCard({super.key, required this.school});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // School name
            Text(
              school.name,
              style: textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 4),

            // Grade range + address
            Row(
              children: [
                Icon(Icons.school_outlined,
                    size: 14, color: colorScheme.primary),
                const SizedBox(width: 4),
                Text(school.gradesLabel,
                    style: textTheme.bodySmall
                        ?.copyWith(color: colorScheme.primary)),
                const SizedBox(width: 12),
                Icon(Icons.location_on_outlined,
                    size: 14, color: colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    school.address,
                    style: textTheme.bodySmall
                        ?.copyWith(color: colorScheme.onSurfaceVariant),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Score row — or error/unscored state
            if (school.error != null)
              Row(
                children: [
                  Icon(Icons.warning_amber_rounded,
                      size: 16, color: colorScheme.error),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Score unavailable: ${school.error}',
                      style: textTheme.bodySmall
                          ?.copyWith(color: colorScheme.error),
                    ),
                  ),
                ],
              )
            else if (school.quality == null)
              Text('Not yet scored',
                  style: textTheme.bodySmall
                      ?.copyWith(color: colorScheme.onSurfaceVariant))
            else
              Row(
                children: [
                  _ScorePill(
                      label: 'Quality',
                      score: school.quality!,
                      color: _scoreColor(school.quality!, colorScheme)),
                  const SizedBox(width: 10),
                  _ScorePill(
                      label: 'Access',
                      score: school.access!,
                      color: _scoreColor(school.access!, colorScheme)),
                  const SizedBox(width: 10),
                  _ScorePill(
                      label: 'Equity',
                      score: school.equity!,
                      color: _scoreColor(school.equity!, colorScheme)),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Color _scoreColor(int score, ColorScheme cs) {
    if (score >= 8) return const Color(0xFF2E7D32); // green
    if (score >= 5) return const Color(0xFFE65100); // orange
    return const Color(0xFFC62828);                 // red
  }
}

// ---------------------------------------------------------------------------
// Score pill widget
// ---------------------------------------------------------------------------

class _ScorePill extends StatelessWidget {
  final String label;
  final int score;
  final Color color;

  const _ScorePill({
    required this.label,
    required this.score,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$score/10',
            style: TextStyle(
              fontSize: 13,
              color: color,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
