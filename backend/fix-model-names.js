const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Map of PascalCase to snake_case model names
const modelMappings = {
  'model User {': 'model users {',
  'model Account {': 'model accounts {',
  'model Session {': 'model sessions {',
  'model VerificationToken {': 'model verification_tokens {',
  'model Hackathon {': 'model hackathons {',
  'model Track {': 'model tracks {',
  'model Project {': 'model projects {',
  'model Evaluation {': 'model evaluations {',
  'model Tournament {': 'model tournaments {',
  'model TournamentMatch {': 'model tournament_matches {',
  'model ActivityLog {': 'model activity_logs {',
  'model ApiKey {': 'model api_keys {',
  'model CodeQualityReport {': 'model code_quality_reports {',
  'model CoherenceReport {': 'model coherence_reports {',
  'model InnovationReport {': 'model innovation_reports {',
  'model HederaAnalysisReport {': 'model hedera_analysis_reports {',
  'model EligibilityReport {': 'model eligibility_reports {',
  'model Notification {': 'model notifications {',
  'model AIJurySession {': 'model ai_jury_sessions {',
  'model AIJuryLayerResult {': 'model ai_jury_layer_results {',
};

// Replace model names
for (const [pascalCase, snakeCase] of Object.entries(modelMappings)) {
  content = content.replace(new RegExp(pascalCase, 'g'), snakeCase);
}

// Also need to update enum references in model fields
// This is more complex, but the main ones are:
const typeReplacements = {
  'User ': 'users ',
  'Account\\[\\]': 'accounts[]',
  'Session\\[\\]': 'sessions[]',
  'Hackathon ': 'hackathons ',
  'Hackathon\\[\\]': 'hackathons[]',
  'Track ': 'tracks ',
  'Track\\[\\]': 'tracks[]',
  'Project ': 'projects ',
  'Project\\?': 'projects?',
  'Project\\[\\]': 'projects[]',
  'Tournament\\?': 'tournaments?',
  'TournamentMatch\\[\\]': 'tournament_matches[]',
  'ActivityLog\\[\\]': 'activity_logs[]',
  'ApiKey\\[\\]': 'api_keys[]',
  'CodeQualityReport\\[\\]': 'code_quality_reports[]',
  'CoherenceReport\\[\\]': 'coherence_reports[]',
  'InnovationReport\\[\\]': 'innovation_reports[]',
  'HederaAnalysisReport\\[\\]': 'hedera_analysis_reports[]',
  'EligibilityReport\\[\\]': 'eligibility_reports[]',
  'Notification\\[\\]': 'notifications[]',
  'AIJurySession': 'ai_jury_sessions',
  'AIJuryLayerResult\\[\\]': 'ai_jury_layer_results[]',
};

for (const [pascalType, snakeType] of Object.entries(typeReplacements)) {
  content = content.replace(new RegExp(pascalType, 'g'), snakeType);
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('✅ Schema model names updated to snake_case successfully!');
