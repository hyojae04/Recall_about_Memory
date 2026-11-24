import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('overview shows measured results and a working chart data table', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: '기억의 차이를, 직접 확인하세요.' }),
  ).toBeVisible();
  await expect(page.locator('.metric-card').first()).toContainText('85%');
  await page.getByText('차트 데이터 보기').click();
  await expect(page.locator('.chart-data table')).toBeVisible();
  await expect(page.locator('.chart-data')).toContainText('8/8');
});

test('worker runs a benchmark with changed K and exports its actual results', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('벤치마크 검색 결과 수').selectOption('1');
  await expect(page.locator('.settings-notice')).toContainText('K = 1');
  await page.getByRole('button', { name: '실험 실행', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('K = 1');
  await expect(page.locator('.settings-notice')).toHaveCount(0);
  await expect(page.locator('.metric-card').first()).toContainText('Recall@1');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '실험 결과 내보내기' }).click();
  const download = await downloadPromise;
  const data = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(data.k).toBe(1);
  expect(data.scores).toHaveLength(144);
  expect(data.summaries).toHaveLength(3);
});

test('playground exposes obsolete evidence, corrected evidence and source context', async ({
  page,
}) => {
  await page.goto('/#playground/mina-update');
  await expect(page.locator('.retrieval-panel.bm25')).toContainText('이전 정보');
  await expect(page.locator('.retrieval-panel.temporal')).toContainText('루이보스차');
  await expect(page.locator('.retrieval-panel.temporal .evidence-tag.stale')).toHaveCount(0);
  await page.locator('.retrieval-panel.temporal .evidence-source').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.timeline-item.highlighted')).toContainText('루이보스차');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('a worker load failure preserves results and offers a working retry', async ({ page }) => {
  await page.goto('/');
  await page.route('**/benchmark.worker.ts*', (route) => route.abort());
  await page.getByRole('button', { name: '실험 실행', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('실험 엔진을 불러오지 못했습니다.');
  await expect(page.locator('.metric-card').first()).toContainText('85%');
  await page.unroute('**/benchmark.worker.ts*');
  await page.getByRole('button', { name: '다시 실행', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('실험을 완료했습니다.');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('past cutoff prevents future corrections from leaking into results', async ({ page }) => {
  await page.goto('/#playground/mina-temporal');
  await expect(page.getByLabel('조회 시점 UTC')).toHaveValue('2026-10-06');
  await expect(page.locator('.retrieval-panel.temporal')).toContainText('아이스 아메리카노');
  await expect(page.locator('.retrieval-panel.temporal')).not.toContainText('루이보스차');
  await expect(page.locator('.retrieval-panel.temporal')).toContainText('완전 통과');
});

test('custom questions are ungraded and empty query cannot submit', async ({ page }) => {
  await page.goto('/#playground');
  await page.getByLabel('기억에 대한 질문').fill('은하계 블랙홀 질량');
  await page.getByRole('button', { name: '기억 검색', exact: true }).click();
  await expect(page.locator('.retrieval-panel.temporal')).toContainText('자유 질문 · 미채점');
  await expect(page.locator('.retrieval-panel.temporal')).toContainText('일치하는 근거가 없어요');
  await expect(page.locator('.reference-panel')).toHaveCount(0);
  await page.getByLabel('기억에 대한 질문').fill('');
  await expect(page.getByRole('button', { name: '기억 검색', exact: true })).toBeDisabled();
});

test('dataset filters, empty state and case navigation work', async ({ page }) => {
  await page.goto('/#dataset');
  await expect(page.locator('.dataset-count')).toContainText('48개의 질문');
  await page.getByRole('button', { name: '정보 갱신', exact: true }).click();
  await expect(page.locator('.dataset-count')).toContainText('8개의 질문');
  await page.getByLabel('데이터셋 검색').fill('없는이름');
  await expect(page.getByRole('heading', { name: '일치하는 질문이 없어요' })).toBeVisible();
  await page.getByLabel('데이터셋 검색').fill('유나');
  await expect(page.locator('.dataset-count')).toContainText('1개의 질문');
  await page.getByRole('button', { name: 'yuna-update 실험하기' }).click();
  await expect(page.getByLabel('대화 선택')).toHaveValue('yuna');
  await expect(page.locator('.retrieval-panel.temporal')).toContainText('재즈 피아노');
});

test('dataset export contains raw memories and gold labels', async ({ page }) => {
  await page.goto('/#dataset');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '데이터 내보내기' }).click();
  const download = await pending;
  const data = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(data.conversations).toHaveLength(8);
  expect(data.cases).toHaveLength(48);
});

test('mobile navigation and page layout work at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await page.getByRole('link', { name: '플레이그라운드', exact: true }).click();
  await expect(page.getByRole('heading', { name: '기억에게 물어보세요.' })).toBeVisible();
  await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
  for (const hash of ['overview', 'playground', 'dataset', 'methods']) {
    await page.goto(`/#${hash}`);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

for (const route of ['overview', 'playground', 'dataset', 'methods']) {
  test(`${route} has no WCAG A/AA accessibility violations`, async ({ page }) => {
    await page.goto(`/#${route}`);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  });
}

test('captures all primary screens without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['overview', 'playground', 'dataset', 'methods']) {
    await page.goto(`/#${route}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/${route}-desktop.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#overview');
  await page.screenshot({
    path: 'docs/overview-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.goto('/#playground');
  await page.screenshot({
    path: 'docs/playground-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/#overview');
  await page.screenshot({
    path: 'docs/overview-tablet.png',
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
