import { NextRequest, NextResponse } from 'next/server';
import { togetherAIService } from '@/lib/services/together-ai-service';

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Starting simple AI-only test...');

    // Simple test code for AI analysis
    const testCode = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

export default calculateTotal;
`;

    console.log('Making direct AI service call...');
    const startTime = Date.now();

    // Test the AI service directly with timeout
    const result = await togetherAIService.analyzeCodeFile('test-file.js', testCode, 'javascript');

    const duration = Date.now() - startTime;
    console.log(`✅ AI analysis completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration,
      data: {
        filename: 'test-file.js',
        analysisResult: result,
        message: 'Simple AI test completed successfully'
      }
    });

  } catch (error) {
    console.error('❌ Simple AI test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Simple AI test failed'
    }, { status: 500 });
  }
}