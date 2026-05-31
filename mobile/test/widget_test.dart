import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:talentai_mobile/main.dart';

void main() {
  testWidgets('app widget can be constructed', (WidgetTester tester) async {
    expect(const TalentAIMobileApp(), isA<StatelessWidget>());
  });
}
