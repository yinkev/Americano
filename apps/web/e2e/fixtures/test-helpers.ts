/**
 * E2E Test Helper Functions
 * Shared utilities for knowledge graph E2E tests
 *
 * @author Test Automation Team
 * @date 2025-10-17
 */

import { Page, expect } from '@playwright/test';

/**
 * Interface for concept data
 */
export interface TestConcept {
  name: string;
  description: string;
  category: 'anatomy' | 'physiology' | 'pathology' | 'pharmacology' | 'biochemistry' | 'microbiology' | 'immunology' | 'clinical';
}

/**
 * Interface for relationship data
 */
export interface TestRelationship {
  concept1: string;
  concept2: string;
  type: 'RELATED' | 'INTEGRATED' | 'PREREQUISITE';
  strength: number;
}

/**
 * Mock concept datasets for testing
 */
export const MOCK_DATASETS = {
  smallSet: (): TestConcept[] => [
    {
      name: 'cardiac action potential',
      description: 'Electrical changes in cardiac myocytes',
      category: 'physiology',
    },
    {
      name: 'atrial fibrillation',
      description: 'Rapid irregular atrial contractions',
      category: 'pathology',
    },
    {
      name: 'beta-blocker',
      description: 'Drug that blocks beta-adrenergic receptors',
      category: 'pharmacology',
    },
  ],

  mediumSet: (): TestConcept[] => [
    {
      name: 'cardiac conduction system',
      description: 'SA node, AV node, bundle branches, Purkinje fibers',
      category: 'anatomy',
    },
    {
      name: 'action potential',
      description: 'Rapid depolarization and repolarization',
      category: 'physiology',
    },
    {
      name: 'automaticity',
      description: 'Ability of cardiac cells to generate action potentials',
      category: 'physiology',
    },
    {
      name: 'arrhythmia',
      description: 'Abnormal heart rhythm',
      category: 'pathology',
    },
    {
      name: 'myocardial infarction',
      description: 'Death of cardiac muscle due to ischemia',
      category: 'pathology',
    },
    {
      name: 'troponin',
      description: 'Cardiac biomarker for MI detection',
      category: 'biochemistry',
    },
    {
      name: 'ejection fraction',
      description: 'Percentage of blood ejected per beat',
      category: 'physiology',
    },
    {
      name: 'ACE inhibitor',
      description: 'Drug reducing angiotensin II levels',
      category: 'pharmacology',
    },
  ],
};

/**
 * Wait for graph to fully render with specified number of nodes
 * @param page - Playwright page object
 * @param minNodes - Minimum expected node count
 * @param timeout - Maximum wait time in milliseconds
 */
export async function waitForGraphRender(
  page: Page,
  minNodes: number = 1,
  timeout: number = 30000
): Promise<number> {
  // Wait for React Flow container
  await page.waitForSelector('[role="region"][aria-label*="graph"]', {
    timeout,
  });

  // Wait for first node to appear
  await page.locator('.react-flow__node').first().waitFor({
    state: 'visible',
    timeout,
  });

  // Count nodes
  const nodeCount = await page.locator('.react-flow__node').count();

  // Verify minimum node count
  expect(nodeCount).toBeGreaterThanOrEqual(minNodes);

  return nodeCount;
}

/**
 * Wait for graph animation to complete
 * @param page - Playwright page object
 * @param timeout - Maximum wait time
 */
export async function waitForGraphAnimation(page: Page, timeout: number = 2000): Promise<void> {
  await page.waitForTimeout(timeout);

  // Wait for any remaining animations to complete
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const checkComplete = () => {
        const animatingElements = document.querySelectorAll('[data-animating="true"]');
        if (animatingElements.length === 0) {
          resolve(null);
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });
  });
}

/**
 * Click a specific node by its label text
 * @param page - Playwright page object
 * @param nodeLabel - Text content of the node
 */
export async function clickNodeByLabel(page: Page, nodeLabel: string): Promise<void> {
  const node = page.locator('.react-flow__node:has-text("' + nodeLabel + '")').first();
  await node.click();

  // Wait for selection state to update
  await page.waitForTimeout(300);
}

/**
 * Get count of visible edges in the graph
 * @param page - Playwright page object
 */
export async function getEdgeCount(page: Page): Promise<number> {
  return await page.locator('.react-flow__edge').count();
}

/**
 * Verify graph controls are visible and functional
 * @param page - Playwright page object
 */
export async function verifyGraphControls(page: Page): Promise<boolean> {
  const controls = [
    'button[aria-label*="Fit"]',
    'button[aria-label*="Zoom in"]',
    'button[aria-label*="Zoom out"]',
  ];

  for (const control of controls) {
    const element = page.locator(control).first();
    if (!(await element.isVisible())) {
      return false;
    }
  }

  return true;
}

/**
 * Zoom in on the graph
 * @param page - Playwright page object
 * @param steps - Number of zoom steps
 */
export async function zoomGraphIn(page: Page, steps: number = 1): Promise<void> {
  const zoomButton = page.locator('button[aria-label*="Zoom in"]').first();

  for (let i = 0; i < steps; i++) {
    await zoomButton.click();
    await page.waitForTimeout(100);
  }
}

/**
 * Zoom out on the graph
 * @param page - Playwright page object
 * @param steps - Number of zoom steps
 */
export async function zoomGraphOut(page: Page, steps: number = 1): Promise<void> {
  const zoomButton = page.locator('button[aria-label*="Zoom out"]').first();

  for (let i = 0; i < steps; i++) {
    await zoomButton.click();
    await page.waitForTimeout(100);
  }
}

/**
 * Toggle clustering view
 * @param page - Playwright page object
 * @param mode - 'course' or 'topic'
 */
export async function setClusteringMode(page: Page, mode: 'course' | 'topic'): Promise<void> {
  const clusterButton = page.locator('button:has-text("Toggle Cluster")').first();
  const currentMode = await page.locator('text=/Clustered by: (Course|Topic)/').textContent();

  const needsToggle =
    (mode === 'course' && currentMode?.includes('Topic')) ||
    (mode === 'topic' && currentMode?.includes('Course'));

  if (needsToggle) {
    await clusterButton.click();
    await page.waitForTimeout(500); // Wait for re-layout
  }
}

/**
 * Get selected node information from details panel
 * @param page - Playwright page object
 */
export async function getSelectedNodeInfo(
  page: Page
): Promise<{ label: string; type: string; relevance: number } | null> {
  const detailsPanel = page.locator('.node-details-panel, [role="region"]:has-text("Relevance")').first();

  if (!(await detailsPanel.isVisible({ timeout: 1000 }).catch(() => false))) {
    return null;
  }

  const label = await detailsPanel.locator('.node-label, [role="heading"]').first().textContent();
  const type = await detailsPanel.locator('.node-type, [aria-label*="type"]').textContent();
  const relevanceText = await detailsPanel.locator('text=/Relevance:/').textContent();

  const relevance = relevanceText ? parseInt(relevanceText.match(/\d+/)?.[0] || '0') / 100 : 0;

  return label && type ? { label: label.trim(), type: type.trim(), relevance } : null;
}

/**
 * Measure graph build performance
 * @param page - Playwright page object
 * @param action - Async function that triggers graph build
 */
export async function measureGraphBuildTime(
  page: Page,
  action: () => Promise<void>
): Promise<number> {
  const startTime = Date.now();

  await action();

  // Wait for graph to render
  await waitForGraphRender(page, 1, 60000);

  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Verify node styling matches expected type
 * @param page - Playwright page object
 * @param nodeIndex - Index of node in DOM
 * @param expectedType - Expected node type
 */
export async function verifyNodeStyling(
  page: Page,
  nodeIndex: number,
  expectedType: string
): Promise<boolean> {
  const node = page.locator('.react-flow__node').nth(nodeIndex);

  // Check if node has correct data attribute
  const dataType = await node.getAttribute('data-type');
  if (dataType && dataType !== expectedType) {
    return false;
  }

  // Check if node has correct color (oklch format)
  const style = await node.getAttribute('style');
  if (style && !style.includes('oklch')) {
    return false;
  }

  return true;
}

/**
 * Check if any edges connect to a specific node
 * @param page - Playwright page object
 * @param nodeId - Node ID to check
 */
export async function hasConnectedEdges(page: Page, nodeId: string): Promise<boolean> {
  const edges = await page.locator(`.react-flow__edge[data-source="${nodeId}"], .react-flow__edge[data-target="${nodeId}"]`);
  return (await edges.count()) > 0;
}

/**
 * Wait for processing status to update
 * @param page - Playwright page object
 * @param expectedStatus - Expected status text
 * @param timeout - Max wait time
 */
export async function waitForStatus(
  page: Page,
  expectedStatus: string,
  timeout: number = 30000
): Promise<void> {
  await page.locator(`text=${expectedStatus}`).waitFor({
    state: 'visible',
    timeout,
  });
}

/**
 * Get performance metrics from page
 */
export async function getPerformanceMetrics(
  page: Page
): Promise<{
  buildTime?: number;
  nodeCount?: number;
  edgeCount?: number;
  renderTime?: number;
}> {
  return await page.evaluate(() => {
    // @ts-ignore
    return window.__TEST_METRICS__ || {};
  });
}
