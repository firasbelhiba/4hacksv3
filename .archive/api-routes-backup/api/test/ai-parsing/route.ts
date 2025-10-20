import { NextRequest, NextResponse } from 'next/server';
import { githubService } from '@/lib/services/github-service';
import { togetherAIService } from '@/lib/services/together-ai-service';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Testing AI parsing with FootTime-hub repository...');

    // Analyze the FootTime-hub repository
    const repositoryUrl = 'https://github.com/shemmyhubb/FootTime-hub';
    const [owner, repo] = repositoryUrl.replace('https://github.com/', '').split('/');

    console.log(`🔍 Fetching files from ${owner}/${repo}...`);

    // Get all files first
    const allFiles = await githubService.getAllFiles(owner, repo);

    console.log(`✅ Found ${allFiles.length} files in repository`);

    // Filter for code files
    const codeFiles = allFiles.filter(file =>
      file.name.endsWith('.js') ||
      file.name.endsWith('.jsx') ||
      file.name.endsWith('.ts') ||
      file.name.endsWith('.tsx') ||
      file.name.endsWith('.py') ||
      file.name.endsWith('.java')
    );

    console.log(`📁 Found ${codeFiles.length} code files`);

    // Get content for first 3 code files
    const testFiles = codeFiles.slice(0, 3);

    console.log('🔍 Fetching file contents...');
    const filesWithContent = await githubService.getFilesWithContent(owner, repo, testFiles);

    console.log(`🔍 Analyzing ${testFiles.length} code files with enhanced AI parsing...`);

    const results = [];

    for (const file of filesWithContent) {
      console.log(`📝 Analyzing ${file.name}...`);

      try {
        // Analyze each file
        const result = await togetherAIService.analyzeCodeFile(
          file.name,
          file.content,
          file.name.split('.').pop() || 'text'
        );

        results.push(result);
        console.log(`✅ Completed analysis for ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to analyze ${file.name}:`, error);
        results.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Analysis failed'
        });
      }
    }

    console.log('✅ Analysis completed for all files');

    return NextResponse.json({
      success: true,
      data: {
        repository: {
          url: repositoryUrl,
          totalFiles: allFiles.length,
          codeFiles: codeFiles.length,
          analyzedFiles: filesWithContent.length
        },
        results,
        message: `Enhanced AI analysis completed for FootTime-hub repository - analyzed ${testFiles.length} files`
      }
    });

  } catch (error) {
    console.error('❌ AI parsing test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}