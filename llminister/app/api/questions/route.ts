import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { QuestionController } from '../../../backend/src/controllers/questionController';

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd());
    const dataDir = path.join(projectRoot, '..', 'data');

    // Initialize controller with a dummy API key since it's not needed for GET
    const controller = new QuestionController('dummy-key', dataDir);

    const questions = await controller.getQuestions();

    return NextResponse.json({
      status: 'success',
      questions,
      message: 'Questions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { questionId, update, apiKey } = await request.json();

    if (!questionId || !update || !apiKey) {
      return NextResponse.json(
        { error: 'Question ID, update data, and API key are required' },
        { status: 400 }
      );
    }

    const projectRoot = path.resolve(process.cwd());
    const dataDir = path.join(projectRoot, '..', 'data');

    const controller = new QuestionController(apiKey, dataDir);
    const updatedQuestion = await controller.updateQuestion(questionId, update);

    return NextResponse.json({
      status: 'success',
      question: updatedQuestion,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Support both URL parameters and JSON body
    let questionId: string | null = null;
    let questionText: string | null = null;
    let apiKey: string | null = null;

    // Try to get parameters from URL first
    const { searchParams } = new URL(request.url);
    questionId = searchParams.get('id');
    questionText = searchParams.get('text');
    apiKey = searchParams.get('apiKey');

    // If not in URL params, try to get from request body
    if (!questionId && !questionText) {
      try {
        const body = await request.json();
        questionId = body.questionId || null;
        questionText = body.questionText || null;
        apiKey = body.apiKey || apiKey;
      } catch (e) {
        // Ignore JSON parsing errors as the body might be empty
      }
    }

    if ((!questionId && !questionText) || !apiKey) {
      return NextResponse.json(
        { error: 'Either Question ID or Question Text, and API key are required' },
        { status: 400 }
      );
    }

    const projectRoot = path.resolve(process.cwd());
    const dataDir = path.join(projectRoot, '..', 'data');

    const controller = new QuestionController(apiKey, dataDir);

    // Get all questions first to ensure we have the latest data
    const questions = await controller.getQuestions();
    let targetQuestionId = questionId;

    if (!targetQuestionId && questionText) {
      // Find question by text if no ID provided
      const questionToDelete = questions.find(q =>
        q.question_text === questionText
      );

      if (!questionToDelete) {
        return NextResponse.json(
          { error: 'Question not found with the specified text' },
          { status: 404 }
        );
      }

      targetQuestionId = questionToDelete.id;
    }

    if (!targetQuestionId) {
      return NextResponse.json(
        { error: 'Could not determine which question to delete' },
        { status: 400 }
      );
    }

    // Delete the question
    await controller.deleteQuestion(targetQuestionId);

    return NextResponse.json({
      status: 'success',
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}