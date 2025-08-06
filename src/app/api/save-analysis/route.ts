import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `linkedin-hook-analysis-${timestamp}.json`;
    
    // Structure the data for export
    const exportData = {
      timestamp: new Date().toISOString(),
      exportVersion: '1.0',
      metadata: {
        postIdea: data.postIdea,
        industry: data.industry,
        targetAudience: data.targetAudience,
        contentType: data.contentType,
        selectedModels: data.selectedModels,
        focusSkills: data.focusSkills || [],
        analysisOptions: data.analysisOptions || []
      },
      results: data.results,
      comparison: data.comparison,
      analytics: data.analytics,
      insights: data.insights,
      rawJudgeResponses: data.rawJudgeResponses || null,
      judgePrompts: data.judgePrompts || null
    };
    
    // Return the JSON data for client-side download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      }
    });
    
  } catch (error) {
    console.error('Error preparing analysis export:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to prepare analysis export',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}