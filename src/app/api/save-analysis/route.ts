/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `linkedin-hook-analysis-${timestamp}.json`;
    
    // Save to project root/analysis-exports directory
    const exportDir = join(process.cwd(), 'analysis-exports');
    const filePath = join(exportDir, filename);
    
    // Ensure directory exists
    try {
      await writeFile(join(exportDir, '.gitkeep'), '');
    } catch {
      // Directory already exists or was created
    }
    
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
        analysisOptions: data.analysisOptions
      },
      results: data.results,
      comparison: data.comparison,
      analytics: data.analytics,
      insights: data.insights,
      rawJudgeResponses: data.rawJudgeResponses || null,
      judgePrompts: data.judgePrompts || null
    };
    
    await writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
    
    return NextResponse.json({
      success: true,
      filename,
      path: filePath,
      size: JSON.stringify(exportData).length
    });
    
  } catch (error) {
    console.error('Error saving analysis:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}