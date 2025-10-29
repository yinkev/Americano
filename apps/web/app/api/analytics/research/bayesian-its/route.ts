/**
 * Next.js API Route: Bayesian ITS Analysis
 *
 * Proxies requests to Python FastAPI service for Bayesian Interrupted Time Series analysis.
 *
 * Endpoint: POST /api/analytics/research/bayesian-its
 * Backend: http://localhost:8000/analytics/its/analyze
 *
 * Timeout: 120s (MCMC sampling can take 60-120 seconds)
 *
 * Created: 2025-10-27T09:30:00-07:00
 * Part of: Day 7-8 Research Analytics Implementation
 */

import { NextRequest, NextResponse } from 'next/server';

// Python FastAPI service URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';
const ITS_ENDPOINT = `${PYTHON_API_URL}/analytics/its/analyze`;

// Timeout for MCMC sampling (120 seconds)
const REQUEST_TIMEOUT = 120000;

/**
 * POST handler for Bayesian ITS analysis
 *
 * Request body: ITSAnalysisRequest
 * {
 *   user_id: string
 *   intervention_date: string (ISO 8601)
 *   outcome_metric?: string
 *   include_day_of_week?: boolean
 *   include_time_of_day?: boolean
 *   mcmc_samples?: number
 *   mcmc_chains?: number
 *   start_date?: string
 *   end_date?: string
 * }
 *
 * Response: ITSAnalysisResponse (see Day 5-6 implementation)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      );
    }

    if (!body.intervention_date) {
      return NextResponse.json(
        { error: 'Missing required field: intervention_date' },
        { status: 400 }
      );
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      // Proxy request to Python FastAPI service
      const response = await fetch(ITS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Handle Python FastAPI errors
      if (!response.ok) {
        // Map status codes
        if (response.status === 400) {
          // Invalid data (insufficient observations, bad dates, etc.)
          return NextResponse.json(
            {
              error: data.detail || 'Invalid analysis parameters',
              type: 'validation_error',
            },
            { status: 400 }
          );
        } else if (response.status === 500) {
          // MCMC convergence failure or computation error
          return NextResponse.json(
            {
              error: data.detail || 'Analysis computation failed',
              type: 'computation_error',
            },
            { status: 500 }
          );
        } else {
          // Other errors
          return NextResponse.json(
            {
              error: data.detail || 'Unknown error',
              type: 'unknown_error',
            },
            { status: response.status }
          );
        }
      }

      // Return successful response
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          {
            error: 'Analysis timeout - MCMC sampling took longer than 120 seconds',
            type: 'timeout_error',
            suggestion: 'Try reducing mcmc_samples or mcmc_chains parameters',
          },
          { status: 504 }
        );
      }

      // Handle network errors
      if (fetchError instanceof TypeError) {
        return NextResponse.json(
          {
            error: 'Cannot connect to Python analytics service',
            type: 'network_error',
            details: 'Ensure Python FastAPI service is running on port 8000',
          },
          { status: 503 }
        );
      }

      // Re-throw unexpected errors
      throw fetchError;
    }
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          type: 'parse_error',
        },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error('Bayesian ITS API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        type: 'server_error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    }
  );
}
