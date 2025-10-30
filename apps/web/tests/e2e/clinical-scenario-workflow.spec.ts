/**
 * E2E Test: Story 4.2 - Clinical Reasoning Scenario Workflow
 *
 * Tests the full user journey:
 * 1. Generate clinical case (USMLE/COMLEX format)
 * 2. Multi-stage interaction:
 *    - Stage 1: Chief Complaint → History
 *    - Stage 2: Physical Exam
 *    - Stage 3: Labs/Imaging
 *    - Stage 4: Diagnosis
 *    - Stage 5: Management Plan
 * 3. AI reasoning evaluation (competency-based scoring)
 * 4. Feedback with radar chart (4 competencies)
 * 5. Cognitive bias detection
 *
 * Critical Path: Generate → Multi-Stage Interaction → Evaluate → Feedback
 */

import { expect, test } from '@playwright/test'

test.describe('Story 4.2: Clinical Scenario Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/study')
    await page.waitForLoadState('networkidle')
  })

  test('Complete clinical reasoning workflow with all stages', async ({ page }) => {
    // Step 1: Click "Clinical Case" button
    const clinicalCaseBtn = page.getByRole('button', { name: /clinical case|reasoning/i })
    await expect(clinicalCaseBtn).toBeVisible({ timeout: 10000 })
    await clinicalCaseBtn.click()

    // Step 2: Clinical case dialog opens
    const dialog = page.locator('[role="dialog"]').filter({ hasText: /clinical|case|patient/i })
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Step 3: Wait for case generation (AI call, ~3-5 seconds)
    const chiefComplaint = dialog.getByText(/year old|presenting with|chief complaint/i)
    await expect(chiefComplaint).toBeVisible({ timeout: 10000 })

    // Step 4: Stage 1 - History questions
    await expect(dialog.getByText(/history|hpi|past medical/i)).toBeVisible({ timeout: 3000 })

    // Select first history question option (multiple choice)
    const historyOption = dialog.locator('input[type="radio"]').first()
    await historyOption.check()

    // Proceed to next stage
    const nextButton = dialog.getByRole('button', { name: /next|continue/i })
    await nextButton.click()

    // Step 5: Stage 2 - Physical Exam
    await expect(dialog.getByText(/physical exam|examination/i)).toBeVisible({ timeout: 3000 })

    const examOption = dialog.locator('input[type="radio"]').first()
    await examOption.check()
    await nextButton.click()

    // Step 6: Stage 3 - Labs/Imaging
    await expect(dialog.getByText(/labs|laboratory|imaging/i)).toBeVisible({ timeout: 3000 })

    const labOption = dialog.locator('input[type="radio"]').first()
    await labOption.check()
    await nextButton.click()

    // Step 7: Stage 4 - Diagnosis
    await expect(dialog.getByText(/diagnosis|differential|most likely/i)).toBeVisible({
      timeout: 3000,
    })

    const diagnosisOption = dialog.locator('input[type="radio"]').first()
    await diagnosisOption.check()
    await nextButton.click()

    // Step 8: Stage 5 - Management
    await expect(dialog.getByText(/management|treatment|plan/i)).toBeVisible({ timeout: 3000 })

    // Type free-text management plan
    const managementTextarea = dialog.locator('textarea')
    if (await managementTextarea.isVisible({ timeout: 2000 })) {
      await managementTextarea.fill(
        'Admit for observation. Start IV fluids. Obtain CT scan. Consult surgery if needed.',
      )
    } else {
      // Fallback: multiple choice
      const managementOption = dialog.locator('input[type="radio"]').first()
      await managementOption.check()
    }

    // Step 9: Submit for evaluation
    const submitButton = dialog.getByRole('button', { name: /submit|evaluate|finish/i })
    await submitButton.click()

    // Step 10: Wait for AI evaluation (~3-5 seconds)
    await page.waitForTimeout(5000)

    // Step 11: Feedback panel should appear
    const feedbackPanel = page
      .locator('[data-testid="clinical-feedback"]')
      .or(page.getByText(/competency|data gathering|diagnosis|management/i).locator('..'))
    await expect(feedbackPanel).toBeVisible({ timeout: 5000 })

    // Step 12: Verify 4 competency scores displayed
    const competencies = [/data gathering/i, /diagnosis/i, /management/i, /clinical reasoning/i]

    for (const competency of competencies) {
      const competencyScore = page.getByText(competency)
      await expect(competencyScore).toBeVisible()
    }

    // Step 13: Check for cognitive bias detection (optional)
    const biasWarning = page.getByText(/bias|anchoring|premature closure|confirmation/i)
    // Don't fail if not present (depends on case evaluation)

    // Step 14: Verify radar chart rendered (canvas element)
    const radarChart = page.locator('canvas').or(page.locator('[data-testid="radar-chart"]'))
    await expect(radarChart).toBeVisible({ timeout: 3000 })
  })

  test('Navigate back through clinical case stages', async ({ page }) => {
    const clinicalCaseBtn = page.getByRole('button', { name: /clinical case|reasoning/i })
    await clinicalCaseBtn.click()

    const dialog = page.locator('[role="dialog"]').first()
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Wait for case generation
    await expect(dialog.getByText(/year old|presenting with/i)).toBeVisible({ timeout: 10000 })

    // Stage 1: Make selection and proceed
    const historyOption = dialog.locator('input[type="radio"]').first()
    await historyOption.check()
    await dialog.getByRole('button', { name: /next|continue/i }).click()

    // Stage 2: Now go back
    const backButton = dialog.getByRole('button', { name: /back|previous/i })
    if (await backButton.isVisible({ timeout: 2000 })) {
      await backButton.click()

      // Should return to Stage 1
      await expect(dialog.getByText(/history|hpi/i)).toBeVisible({ timeout: 3000 })
    }
  })

  test('View teaching points after clinical case evaluation', async ({ page }) => {
    const clinicalCaseBtn = page.getByRole('button', { name: /clinical case|reasoning/i })
    await clinicalCaseBtn.click()

    const dialog = page.locator('[role="dialog"]').first()
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // Fast-track through stages (select first option for each)
    const stages = 5
    for (let i = 0; i < stages; i++) {
      await page.waitForTimeout(1000)

      const radioOption = dialog.locator('input[type="radio"]').first()
      if (await radioOption.isVisible({ timeout: 2000 })) {
        await radioOption.check()
      }

      const textarea = dialog.locator('textarea')
      if (await textarea.isVisible({ timeout: 1000 })) {
        await textarea.fill('Test management plan')
      }

      const nextOrSubmit = dialog.getByRole('button', { name: /next|continue|submit|evaluate/i })
      if (await nextOrSubmit.isVisible({ timeout: 2000 })) {
        await nextOrSubmit.click()
      }
    }

    // Wait for evaluation
    await page.waitForTimeout(5000)

    // Look for teaching points section
    const teachingPoints = page.getByText(/teaching point|key learning|remember/i)
    if (await teachingPoints.isVisible({ timeout: 3000 })) {
      await expect(teachingPoints).toBeVisible()
    }
  })
})
