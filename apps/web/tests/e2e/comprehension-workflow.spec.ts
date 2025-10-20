/**
 * E2E Test: Story 4.1 - Complete Comprehension Validation Workflow
 *
 * Tests the full user journey:
 * 1. Generate comprehension prompt for an objective
 * 2. User answers with natural language explanation
 * 3. Pre-assessment confidence capture (1-5 scale)
 * 4. AI evaluation (ChatMock/GPT-5)
 * 5. Post-assessment confidence capture (optional)
 * 6. Calibration feedback display
 * 7. Reflection prompt (if calibration delta > 15)
 *
 * Critical Path: Generate → Answer → Confidence → Evaluate → Calibrate → Reflect
 */

import { test, expect } from '@playwright/test';

test.describe('Story 4.1: Comprehension Validation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to study page
    await page.goto('http://localhost:3001/study');
    await page.waitForLoadState('networkidle');
  });

  test('Complete comprehension workflow with overconfidence calibration', async ({ page }) => {
    // Step 1: Click "Test Understanding" button to open comprehension dialog
    const testUnderstandingBtn = page.getByRole('button', { name: /test understanding/i });
    await expect(testUnderstandingBtn).toBeVisible({ timeout: 10000 });
    await testUnderstandingBtn.click();

    // Step 2: Dialog should open with pre-assessment confidence slider
    const dialog = page.locator('[role="dialog"]').filter({ hasText: /test your understanding/i });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Step 3: Select high confidence (5 = "Very Confident")
    const confidenceSlider = dialog.locator('input[type="range"]').first();
    await confidenceSlider.fill('5');

    // Verify confidence label updates
    const confidenceLabel = dialog.getByText(/very confident/i);
    await expect(confidenceLabel).toBeVisible();

    // Step 4: Click "Continue" to proceed to answer step
    await dialog.getByRole('button', { name: /continue/i }).click();

    // Step 5: Wait for prompt to generate (AI call)
    await expect(dialog.getByText(/explain|describe/i)).toBeVisible({ timeout: 10000 });

    // Step 6: Type a mediocre answer (to trigger overconfidence)
    const answerTextarea = dialog.locator('textarea').first();
    await answerTextarea.fill(
      'Diabetes is when blood sugar is high. You treat it with insulin sometimes. ' +
      'It can cause problems if not managed.'
    );

    // Step 7: Submit answer for evaluation
    await dialog.getByRole('button', { name: /submit|evaluate/i }).click();

    // Step 8: Wait for AI evaluation (ChatMock call, ~3 seconds)
    await page.waitForTimeout(4000);

    // Step 9: Calibration feedback should appear
    const calibrationPanel = page.locator('[data-testid="calibration-feedback"]').or(
      page.getByText(/calibration|confidence/i).locator('..') // fallback: find parent of calibration text
    );
    await expect(calibrationPanel).toBeVisible({ timeout: 5000 });

    // Step 10: Check for overconfidence warning (delta > 15)
    const overconfidentWarning = page.getByText(/overconfident|more confident than/i);
    await expect(overconfidentWarning).toBeVisible();

    // Step 11: Reflection dialog should trigger (calibration delta > 15)
    const reflectionDialog = page.locator('[role="dialog"]').filter({ hasText: /reflect|why/i });
    await expect(reflectionDialog).toBeVisible({ timeout: 5000 });

    // Step 12: Answer reflection question
    const reflectionTextarea = reflectionDialog.locator('textarea');
    await reflectionTextarea.fill('I thought I understood it well but I missed key details about pathophysiology.');

    // Step 13: Submit reflection
    await reflectionDialog.getByRole('button', { name: /submit|save/i }).click();

    // Step 14: Verify workflow completes successfully
    await expect(reflectionDialog).not.toBeVisible({ timeout: 3000 });

    // Success criteria: User returned to study page or sees completion message
    const completionIndicator = page.getByText(/complete|saved|great/i).or(
      page.locator('[data-testid="study-session"]')
    );
    await expect(completionIndicator).toBeVisible({ timeout: 5000 });
  });

  test('Comprehension workflow with well-calibrated confidence', async ({ page }) => {
    // Similar flow but with low confidence (2) and good answer → calibrated result

    const testUnderstandingBtn = page.getByRole('button', { name: /test understanding/i });
    await testUnderstandingBtn.click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Select low confidence (2 = "Somewhat Unconfident")
    const confidenceSlider = dialog.locator('input[type="range"]').first();
    await confidenceSlider.fill('2');

    await dialog.getByRole('button', { name: /continue/i }).click();
    await expect(dialog.getByText(/explain|describe/i)).toBeVisible({ timeout: 10000 });

    // Type a comprehensive answer
    const answerTextarea = dialog.locator('textarea').first();
    await answerTextarea.fill(
      'Type 2 diabetes mellitus is characterized by insulin resistance and relative insulin deficiency. ' +
      'Pathophysiology involves decreased glucose uptake in muscle/adipose tissue due to insulin receptor dysfunction. ' +
      'First-line treatment is lifestyle modification (diet, exercise) followed by metformin (decreases hepatic gluconeogenesis). ' +
      'Complications include microvascular (retinopathy, nephropathy, neuropathy) and macrovascular (CAD, stroke, PAD) disease.'
    );

    await dialog.getByRole('button', { name: /submit|evaluate/i }).click();
    await page.waitForTimeout(4000);

    // Should see calibrated or underconfident feedback (not overconfident)
    const calibratedFeedback = page.getByText(/calibrated|underconfident|stronger than you think/i);
    await expect(calibratedFeedback).toBeVisible({ timeout: 5000 });

    // Reflection should NOT trigger (delta < 15)
    const reflectionDialog = page.locator('[role="dialog"]').filter({ hasText: /reflect|why/i });
    await expect(reflectionDialog).not.toBeVisible({ timeout: 2000 });
  });

  test('Skip post-assessment confidence and proceed', async ({ page }) => {
    // Test optional post-assessment confidence (user can skip)

    const testUnderstandingBtn = page.getByRole('button', { name: /test understanding/i });
    await testUnderstandingBtn.click();

    const dialog = page.locator('[role="dialog"]').first();

    // Pre-assessment confidence
    const confidenceSlider = dialog.locator('input[type="range"]').first();
    await confidenceSlider.fill('3');
    await dialog.getByRole('button', { name: /continue/i }).click();

    // Answer
    await expect(dialog.getByText(/explain|describe/i)).toBeVisible({ timeout: 10000 });
    const answerTextarea = dialog.locator('textarea').first();
    await answerTextarea.fill('Test answer for comprehension validation.');
    await dialog.getByRole('button', { name: /submit|evaluate/i }).click();

    await page.waitForTimeout(4000);

    // If post-assessment confidence dialog appears, click "Skip"
    const skipButton = page.getByRole('button', { name: /skip/i });
    if (await skipButton.isVisible({ timeout: 2000 })) {
      await skipButton.click();
    }

    // Should proceed to calibration feedback
    await expect(page.getByText(/calibration|confidence/i)).toBeVisible({ timeout: 5000 });
  });
});
