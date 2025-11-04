const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMissingData() {
  const reportId = 'cmhdiht7l0001f46cl6k582xk';

  console.log('🔍 Checking for missing data in report:', reportId);
  console.log('');

  try {
    const report = await prisma.code_quality_reports.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      console.log('❌ Report not found!');
      return;
    }

    console.log('📊 CHECKING DATA COMPLETENESS');
    console.log('='.repeat(80));

    // Check fileAnalysis
    console.log('\n🗂️  FILE ANALYSIS:');
    if (report.fileAnalysis) {
      console.log('✅ fileAnalysis exists');
      const fileAnalysis = report.fileAnalysis;
      console.log(`   Files array: ${fileAnalysis.files ? fileAnalysis.files.length + ' files' : '❌ MISSING'}`);
      console.log(`   Summary: ${fileAnalysis.summary ? '✅ exists' : '❌ MISSING'}`);

      if (fileAnalysis.files && fileAnalysis.files.length > 0) {
        console.log('\n   Sample file data:');
        const sampleFile = fileAnalysis.files[0];
        console.log(`   - filename: ${sampleFile.filename || '❌ missing'}`);
        console.log(`   - path: ${sampleFile.path || '❌ missing'}`);
        console.log(`   - language: ${sampleFile.language || '❌ missing'}`);
        console.log(`   - linesOfCode: ${sampleFile.linesOfCode || '❌ missing'}`);
        console.log(`   - complexity: ${sampleFile.complexity || '❌ missing'}`);
        console.log(`   - qualityScore: ${sampleFile.qualityScore || '❌ missing'}`);
        console.log(`   - issues: ${sampleFile.issues ? '✅ exists' : '❌ missing'}`);
      }
    } else {
      console.log('❌ fileAnalysis is NULL or undefined');
    }

    // Check scoreEvidence
    console.log('\n📋 SCORE EVIDENCE:');
    if (report.scoreEvidence) {
      console.log('✅ scoreEvidence exists');
      const evidence = report.scoreEvidence;
      console.log(`   technicalEvidence: ${evidence.technicalEvidence ? evidence.technicalEvidence.length + ' items' : '❌ MISSING'}`);
      console.log(`   securityEvidence: ${evidence.securityEvidence ? evidence.securityEvidence.length + ' items' : '❌ MISSING'}`);
      console.log(`   documentationEvidence: ${evidence.documentationEvidence ? evidence.documentationEvidence.length + ' items' : '❌ MISSING'}`);
      console.log(`   performanceEvidence: ${evidence.performanceEvidence ? evidence.performanceEvidence.length + ' items' : '❌ MISSING'}`);
      console.log(`   richnessEvidence: ${evidence.richnessEvidence ? evidence.richnessEvidence.length + ' items' : '❌ MISSING'}`);
    } else {
      console.log('❌ scoreEvidence is NULL or undefined');
    }

    // Check scoreJustifications
    console.log('\n💭 SCORE JUSTIFICATIONS:');
    if (report.scoreJustifications) {
      console.log('✅ scoreJustifications exists');
      const justifications = report.scoreJustifications;
      console.log(`   technicalJustification: ${justifications.technicalJustification || '❌ MISSING'}`);
      console.log(`   securityJustification: ${justifications.securityJustification || '❌ MISSING'}`);
      console.log(`   documentationJustification: ${justifications.documentationJustification || '❌ MISSING'}`);
      console.log(`   performanceJustification: ${justifications.performanceJustification || '❌ MISSING'}`);
      console.log(`   richnessJustification: ${justifications.richnessJustification || '❌ MISSING'}`);
      console.log(`   overallJustification: ${justifications.overallJustification || '❌ MISSING'}`);
    } else {
      console.log('❌ scoreJustifications is NULL or undefined');
    }

    // Check repositoryStructure
    console.log('\n🏗️  REPOSITORY STRUCTURE:');
    if (report.repositoryStructure) {
      console.log('✅ repositoryStructure exists');
      const structure = report.repositoryStructure;
      console.log(`   totalFiles: ${structure.totalFiles || '❌ MISSING'}`);
      console.log(`   fileTypes: ${structure.fileTypes ? JSON.stringify(structure.fileTypes) : '❌ MISSING'}`);
      console.log(`   packageFiles: ${structure.packageFiles ? structure.packageFiles.length + ' files' : '❌ MISSING'}`);
      console.log(`   configFiles: ${structure.configFiles ? structure.configFiles.length + ' files' : '❌ MISSING'}`);
      console.log(`   directoryDepth: ${structure.directoryDepth || '❌ MISSING'}`);
      console.log(`   modules: ${structure.modules || '❌ MISSING'}`);
      console.log(`   cohesionScore: ${structure.cohesionScore || '❌ MISSING'}`);
      console.log(`   couplingScore: ${structure.couplingScore || '❌ MISSING'}`);
    } else {
      console.log('❌ repositoryStructure is NULL or undefined');
    }

    // Check packageAnalysis
    console.log('\n📦 PACKAGE ANALYSIS:');
    if (report.packageAnalysis) {
      console.log('✅ packageAnalysis exists:', JSON.stringify(report.packageAnalysis, null, 2));
    } else {
      console.log('❌ packageAnalysis is NULL or undefined');
    }

    // Check recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (report.recommendations && Array.isArray(report.recommendations)) {
      console.log(`✅ ${report.recommendations.length} recommendations`);
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. Priority: ${rec.priority || '❌ missing'}, Category: ${rec.category || '❌ missing'}`);
        console.log(`      Description: ${rec.description ? '✅ exists' : '❌ missing'}`);
        console.log(`      Impact: ${rec.impact ? '✅ exists' : '❌ missing'}`);
      });
    } else {
      console.log('❌ recommendations is NULL or empty');
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n🎯 SUMMARY OF MISSING DATA:\n');

    const missing = [];
    if (!report.fileAnalysis || !report.fileAnalysis.files || report.fileAnalysis.files.length === 0) {
      missing.push('❌ File-by-file analysis data');
    }
    if (!report.scoreEvidence) {
      missing.push('❌ Score evidence (supporting data for scores)');
    }
    if (!report.scoreJustifications || !report.scoreJustifications.technicalJustification) {
      missing.push('❌ Detailed score justifications');
    }
    if (!report.repositoryStructure || !report.repositoryStructure.directoryDepth) {
      missing.push('❌ Directory structure metrics (depth, modules, cohesion, coupling)');
    }
    if (!report.recommendations || report.recommendations.length === 0) {
      missing.push('❌ Actionable recommendations');
    }

    if (missing.length > 0) {
      console.log('The following data is MISSING or INCOMPLETE:\n');
      missing.forEach(item => console.log(item));
      console.log('\n💡 This data needs to be requested from the AI and properly parsed.');
    } else {
      console.log('✅ All expected data is present!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingData();
