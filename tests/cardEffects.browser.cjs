/* Run against `npm run dev`: HELIX_TEST_BASE_URL=http://localhost:3000 node tests/cardEffects.browser.cjs.
 * Playwright can be supplied via HELIX_PLAYWRIGHT_MODULE without adding a production dependency.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.HELIX_PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.HELIX_TEST_BASE_URL || 'http://localhost:3000';
const screenshots = process.env.HELIX_EFFECT_SCREENSHOTS;
const card = {
  id: 'effect-test', userId: 'preview-only', firstName: 'Alex', lastName: 'Morgan',
  jobTitle: 'Designer & creative partner', company: 'Fieldwork Studio', theme: 'ocean',
  phoneNumber: '+12125550123', email: 'alex@example.com', linkedIn: 'https://example.com',
  webLinks: [{ url: 'https://example.com', displayText: 'Selected work' }],
  aboutMe: 'I make thoughtful digital experiences for people and the places they call home.',
  customMessageHeader: 'Let’s make something', customMessage: 'Good work starts with a conversation.',
  isActive: true, isPrimary: true,
};
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.HELIX_CHROME_PATH ? { executablePath: process.env.HELIX_CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route(`${origin}/__effect-test`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><iframe title="Effect test" src="/card-preview" style="border:0;width:100vw;height:100vh;display:block"></iframe></body></html>' }));
    await page.goto(`${origin}/__effect-test`);
    const frame = page.frames().find(f => f.url().endsWith('/card-preview')) || await new Promise(resolve => page.once('framenavigated', resolve));
    await frame.waitForSelector('p');
    const update = async (effect, extra = {}, isPro = true) => {
      await page.evaluate(data => document.querySelector('iframe').contentWindow.postMessage({ type: 'helix-preview-update', ...data }, location.origin), { card: { ...card, effect, ...extra }, isPro });
      // Free owners keep the free effects; Pro effects and retired ids fall back to none.
      const shown = (isPro || ['none', 'portal-grid', 'repel'].includes(effect)) && !['holo', 'current', 'develop', 'fold'].includes(effect) ? effect : 'none';
      await frame.waitForSelector(`[data-card-effect="${shown}"]`);
      await frame.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(80);
    };
    const host = () => frame.locator('[data-card-effect]');
    const revealed = () => host().getAttribute('data-fx-revealed');
    const drag = async (x, y, dx, dy, steps = 12) => {
      await page.mouse.move(x, y); await page.mouse.down();
      await page.mouse.move(x + dx, y + dy, { steps }); await page.mouse.up();
    };
    const shot = async name => { if (screenshots) { fs.mkdirSync(screenshots, { recursive: true }); await page.screenshot({ path: `${screenshots}/${name}.png` }); } };
    const hidden = () => frame.locator('[data-fx-content]').evaluate(el => getComputedStyle(el).visibility === 'hidden' && el.inert);

    await update('glitch'); await shot('glitch');
    const name = await frame.locator('h1').boundingBox();
    const nameText = await frame.locator('h1').innerText();
    await page.mouse.move(name.x - 12, name.y + name.height / 2); await page.mouse.down();
    await page.mouse.move(name.x + name.width, name.y + name.height / 2, { steps: 10 });
    // Words under the drag get copies in the glitch palette laid over them, blended into the design.
    const copies = frame.locator('.fx-glitch-text');
    assert((await copies.count()) > 0, 'dragging over the name spawns copies of it');
    const copy = await copies.first().evaluate(el => ({ text: el.textContent, color: getComputedStyle(el).color, blend: getComputedStyle(el).mixBlendMode, top: el.getBoundingClientRect().top }));
    assert(nameText.includes(copy.text) && copy.color === 'rgb(0, 255, 249)' && copy.blend === 'multiply' && Math.abs(copy.top - name.y) < 12, JSON.stringify(copy));
    await shot('glitch-name');
    const icon = await frame.locator('button svg').first().boundingBox();
    await page.mouse.move(icon.x + icon.width / 2, icon.y + icon.height / 2, { steps: 6 }); await page.mouse.up();
    assert((await frame.locator('.fx-glitch-layer svg').count()) > 0, 'icons get cloned copies');
    await page.waitForTimeout(1200);
    assert.equal(await frame.locator('.fx-glitch-ghost').count(), 0, 'every copy is removed once the piece settles');
    assert.equal(await frame.locator('h1').innerText(), nameText);
    assert.equal(await frame.locator('h1').evaluate(el => el.style.transform + el.style.opacity + el.style.transition), '');

    await update('lantern-reveal'); assert(await hidden()); await shot('first-light-locked');
    const lamp = await frame.locator('.fx-lantern-handle').boundingBox();
    await drag(lamp.x + lamp.width / 2, lamp.y + lamp.height / 2, 60, -80);
    assert.equal(await revealed(), 'true'); assert.equal(await frame.locator('[data-fx-content]').evaluate(el => el.inert), false);
    // The lantern travels with the hand and stays on screen. Only where its light has been is lit.
    const carried = await frame.locator('.fx-lantern-handle').boundingBox();
    assert(Math.abs(carried.x - (lamp.x + 60)) < 1 && Math.abs(carried.y - (lamp.y - 80)) < 1);
    const dark = (x, y) => frame.locator('.fx-lantern-sheet').evaluate((el, p) => {
      const scale = el.width / el.clientWidth, top = el.getBoundingClientRect().top;
      return el.getContext('2d').getImageData(Math.round(p[0] * scale), Math.round((p[1] - top) * scale), 1, 1).data[3] / 255;
    }, [x, y]);
    assert((await dark(carried.x + carried.width / 2, carried.y + carried.height / 2)) < 0.05, 'lit under the flame');
    assert((await dark(30, 800)) > 0.9, 'still dark far away');
    assert(await frame.locator('.fx-lantern-sheet').isVisible());
    // Carrying it over most of the card, scrolling included, brings first light to the rest.
    for (let pass = 0; pass < 6; pass++) {
      for (let row = 70; row < 844; row += 130) {
        const at = await frame.locator('.fx-lantern-handle').boundingBox();
        const from = [at.x + at.width / 2, at.y + at.height / 2];
        const to = [(row / 130) % 2 ? 40 : 350, row];
        await page.mouse.move(from[0], from[1]); await page.mouse.down();
        await page.mouse.move(to[0], to[1], { steps: 8 }); await page.mouse.move(390 - to[0], to[1], { steps: 8 }); await page.mouse.up();
      }
      if (await frame.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 1)) break;
      await frame.evaluate(() => window.scrollBy(0, 600)); await page.waitForTimeout(60);
    }
    await frame.waitForSelector('.fx-lantern-dawn', { state: 'attached', timeout: 2000 }); await page.waitForTimeout(1800);
    assert(await frame.locator('.fx-lantern-handle').isVisible()); assert(await frame.locator('.fx-lantern-sheet').isHidden());
    await frame.evaluate(() => window.scrollTo(0, 0)); await shot('first-light-open');

    await update('ripple'); await page.mouse.click(190, 150); await page.waitForTimeout(240);
    assert(await frame.locator('h1').evaluate(el => el.style.transform.includes('translate'))); await shot('ripple');
    await page.waitForTimeout(1800); assert.equal(await frame.locator('h1').evaluate(el => el.style.transform), '');

    await update('black-hole'); const originalColor = await frame.locator('h1').evaluate(el => getComputedStyle(el).color);
    await page.mouse.move(380, 140); await page.mouse.down(); await page.waitForTimeout(1200);
    assert(await frame.locator('h1').evaluate(el => el.style.transform.includes('scale(0.')));
    assert.equal(await frame.locator('h1').evaluate(el => getComputedStyle(el).color), originalColor); await shot('black-hole');
    await page.mouse.up(); await page.waitForTimeout(1400);
    assert.equal(await frame.locator('h1').evaluate(el => el.style.transform), '');

    // Print is temporarily disabled.
    // await update('print'); assert(await hidden()); await shot('print-locked');
    // const print = await frame.locator('.fx-print-handle').boundingBox();
    // const handleX = print.x + print.width / 2, handleY = print.y + print.height / 2;
    // await page.mouse.move(handleX, handleY); await page.mouse.down(); await page.waitForTimeout(1200); await page.mouse.up();
    // assert(await hidden(), 'holding without pulling must not print');
    // await page.waitForTimeout(350);
    // await page.mouse.down(); await page.mouse.move(handleX, handleY - 65, { steps: 8 });
    // assert(Math.abs((await frame.locator('.fx-print-handle').boundingBox()).y - (print.y - 65)) < 1, 'lever follows the finger along the arm arc');
    // await shot('print-partial'); await page.mouse.up();
    // assert(await hidden());
    // await page.waitForTimeout(350);
    // assert(Math.abs((await frame.locator('.fx-print-handle').boundingBox()).y - print.y) < 1, 'short stroke returns the handle');
    // await drag(handleX, handleY, 0, -250);
    // await frame.waitForSelector('[data-fx-revealed="true"]');
    // await shot('print-impression'); await page.waitForTimeout(650); await shot('print-open');
    // assert.equal(await frame.locator('.fx-letterpress').count(), 0);

    await update('overgrown'); assert(await hidden()); await shot('overgrown-locked');
    await drag(50, 100, 260, 50); await page.waitForTimeout(100); assert.equal(await revealed(), 'true'); await shot('overgrown-parted');
    await frame.locator('.fx-accessible-reveal').focus(); await page.keyboard.press('Enter');
    assert.equal(await frame.locator('.fx-canopy').count(), 0);

    await update('take-one'); assert(await hidden()); await shot('take-one-locked');
    const slot = await frame.locator('.fx-dispenser-card').boundingBox();
    const grabX = slot.x + slot.width / 2, grabY = slot.y + slot.height - 20;
    assert(grabY < 844 * 0.3, 'the grab edge hangs in the top part of the screen');
    await page.mouse.move(grabX, grabY); await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up();
    await page.waitForTimeout(600);
    assert(await hidden(), 'holding the card without pulling must not take it');
    await page.mouse.down(); await page.mouse.move(grabX, grabY + 40, { steps: 6 });
    assert(Math.abs((await frame.locator('.fx-dispenser-card').boundingBox()).y - (slot.y + 40)) < 1, 'the card follows the finger out of the slot');
    await shot('take-one-partial'); await page.mouse.up();
    assert(await hidden());
    await page.waitForTimeout(500);
    assert(Math.abs((await frame.locator('.fx-dispenser-card').boundingBox()).y - slot.y) < 1, 'a short pull slides the card back into the slot');
    await drag(grabX, grabY, 0, 200);
    await frame.waitForSelector('[data-fx-revealed="true"]'); await shot('take-one-taken');
    await page.waitForTimeout(700); await shot('take-one-open');
    assert.equal(await frame.locator('.fx-dispenser').count(), 0);
    assert.equal(await frame.evaluate(() => document.documentElement.classList.contains('fx-dispenser-lock')), false);

    // Letting go of a half-pulled card by switching effects leaves nothing behind.
    await update('none'); await update('take-one'); const held = await frame.locator('.fx-dispenser-card').boundingBox();
    await page.mouse.move(held.x + held.width / 2, held.y + held.height - 20); await page.mouse.down();
    await page.mouse.move(held.x + held.width / 2, held.y + held.height + 30, { steps: 4 });
    await update('none'); await page.mouse.up(); await page.waitForTimeout(700);
    assert.equal(await revealed(), null);
    assert.equal(await frame.locator('[data-fx-content]').evaluate(el => el.inert), false);
    assert.equal(await frame.evaluate(() => document.documentElement.classList.contains('fx-dispenser-lock')), false);

    // Print is temporarily disabled.
    // // Switching during a lever pull must not print or alter the next effect.
    // await update('print'); const pending = await frame.locator('.fx-print-handle').boundingBox();
    // await page.mouse.move(pending.x + 50, pending.y + 50); await page.mouse.down();
    // await update('none'); await page.mouse.up(); await page.waitForTimeout(1200);
    // assert.equal(await revealed(), null);
    // assert.equal(await frame.locator('[data-fx-content]').evaluate(el => el.inert), false);
    //
    // // Cancelling a pending impression by switching effects cannot stamp the new card.
    // await update('print'); const stamping = await frame.locator('.fx-print-handle').boundingBox();
    // await drag(stamping.x + stamping.width / 2, stamping.y + stamping.height / 2, 0, -250);
    // await update('none'); await page.waitForTimeout(650);
    // assert.equal(await revealed(), null);
    // assert.equal(await frame.locator('[data-fx-content]').evaluate(el => el.getAnimations().length), 0);

    // Keyboard shortcuts work inside the real editor preview's click guard.
    for (const [effect, selector] of [['lantern-reveal', '.fx-lantern-handle'], ['take-one', '.fx-dispenser-card']]) {
      await update(effect); await frame.locator(selector).focus(); await page.keyboard.press('Enter'); await frame.waitForSelector('[data-fx-revealed="true"]');
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const effect of ['lantern-reveal', 'overgrown', 'take-one']) {
      await update(effect);
      assert.equal(await frame.locator('[data-fx-content]').evaluate(el => getComputedStyle(el).visibility), 'visible');
      assert.equal(await frame.locator('[data-fx-content]').evaluate(el => el.inert), false);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Real touch streams exercise capture, native pointer cancellation, and scrolling.
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, points = []) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y]) => ({ x, y, radiusX: 8, radiusY: 8, force: 1 })) });
    // Print is temporarily disabled.
    // await update('print');
    // const thumb = await frame.locator('.fx-print-handle').boundingBox();
    // const tx = thumb.x + thumb.width / 2, ty = thumb.y + thumb.height / 2;
    // await touch('touchStart', [[tx, ty]]); await touch('touchMove', [[tx, ty - 45]]); await touch('touchCancel');
    // assert(await hidden());
    // await page.waitForTimeout(350);
    // await touch('touchStart', [[tx, ty]]);
    // for (let i = 1; i <= 10; i++) { await touch('touchMove', [[tx, ty - i * 25]]); await page.waitForTimeout(20); }
    // await touch('touchEnd'); await frame.waitForSelector('[data-fx-revealed="true"]');
    // assert.equal(await revealed(), 'true');
    await update('lantern-reveal');
    const flame = await frame.locator('.fx-lantern-handle').boundingBox();
    const lx = flame.x + flame.width / 2, ly = flame.y + flame.height / 2;
    await touch('touchStart', [[lx, ly]]);
    for (let i = 1; i <= 8; i++) { await touch('touchMove', [[lx + i * 10, ly - i * 12]]); await page.waitForTimeout(20); }
    await touch('touchEnd');
    assert.equal(await revealed(), 'true');
    const touched = await frame.locator('.fx-lantern-handle').boundingBox();
    assert(Math.abs(touched.x - (flame.x + 80)) < 1 && Math.abs(touched.y - (flame.y - 96)) < 1);
    await update('none'); await update('take-one');
    const edge = await frame.locator('.fx-dispenser-card').boundingBox();
    const ex = edge.x + edge.width / 2, ey = edge.y + edge.height - 20;
    // A swipe on the wall must neither scroll the hidden page nor chain into pull-to-refresh.
    await touch('touchStart', [[200, 700]]);
    for (let i = 1; i <= 8; i++) { await touch('touchMove', [[200, 700 - i * 40]]); await page.waitForTimeout(20); }
    await touch('touchEnd'); await page.waitForTimeout(200);
    assert.equal(await frame.evaluate(() => scrollY), 0, 'the holder owns every touch that starts on it');
    await touch('touchStart', [[ex, ey]]); await touch('touchMove', [[ex, ey + 40]]); await touch('touchCancel');
    await page.waitForTimeout(500); assert(await hidden());
    await touch('touchStart', [[ex, ey]]);
    for (let i = 1; i <= 10; i++) { await touch('touchMove', [[ex, ey + i * 22]]); await page.waitForTimeout(20); }
    await touch('touchEnd'); await frame.waitForSelector('[data-fx-revealed="true"]');
    assert.equal(await frame.evaluate(() => scrollY), 0);
    await update('ripple');
    await touch('touchStart', [[180, 650]]);
    for (let i = 1; i <= 10; i++) { await touch('touchMove', [[180, 650 - i * 35]]); await page.waitForTimeout(20); }
    await touch('touchEnd'); await page.waitForTimeout(250);
    assert(await frame.evaluate(() => scrollY > 0), 'visual brushes preserve native scrolling');
    assert(await frame.locator('h1').evaluate(el => el.style.transform.includes('translate')));

    // Desktop paper layout and palette combinations retain readable, bounded content.
    await page.setViewportSize({ width: 1280, height: 900 });
    // Print is temporarily disabled.
    // await update('print'); await shot('print-desktop');
    // const desktopPress = await frame.locator('.fx-print-handle').boundingBox();
    // await drag(desktopPress.x + desktopPress.width / 2, desktopPress.y + desktopPress.height / 2, 0, -250);
    // await frame.waitForSelector('[data-fx-revealed="true"]'); await page.waitForTimeout(650);
    // assert(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const theme of ['classic', 'dark', 'neon']) {
      await update('overgrown', { theme }); await drag(200, 100, 500, 50); await shot(`overgrown-${theme}`);
    }
    await update('take-one'); await shot('take-one-desktop');
    const desktopSlot = await frame.locator('.fx-dispenser-card').boundingBox();
    await drag(desktopSlot.x + desktopSlot.width / 2, desktopSlot.y + desktopSlot.height - 20, 0, 260);
    await frame.waitForSelector('[data-fx-revealed="true"]'); await page.waitForTimeout(700);
    assert(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const theme of ['classic', 'dark', 'neon']) { await update('take-one', { theme }); await shot(`take-one-${theme}`); }
    for (const effect of ['holo', 'current', 'develop', 'fold']) {
      await update(effect);
      assert.equal(await host().getAttribute('data-card-effect'), 'none');
    }
    await update('lantern-reveal', {}, false);
    assert.equal(await host().getAttribute('data-card-effect'), 'none');

    // Effects tour: free cards carry it above "Get Your Card", it starts on the effect after the
    // card's own, the floating copy takes over when the footer is out of view or the card is
    // concealed, and finishing returns the card to its saved effect.
    await page.setViewportSize({ width: 390, height: 844 });
    await update('repel', {}, false);
    const dock = () => frame.locator('[data-effect-tour]');
    const float = () => frame.locator('.fx-tour-float');
    assert(await frame.locator('[data-effect-tour] + a', { hasText: 'Get Your Card' }).count() === 1, 'the tour sits directly above the Get Your Card button');
    await dock().locator('button').click();
    await frame.waitForSelector('[data-card-effect="shatter"]');
    assert.match(await dock().innerText(), /Shatter[\s\S]*Drag over elements/);
    assert.doesNotMatch(await dock().innerText(), /\bpro\b/i, 'the visitor-facing tour never labels tiers');
    assert.equal(await float().getAttribute('data-docked'), 'true');
    assert(await float().isHidden(), 'the floating copy stays away while the footer controls are on screen');
    await dock().getByRole('button', { name: 'Next effect' }).click();
    await frame.waitForSelector('[data-card-effect="portal"]');
    await frame.evaluate(() => window.scrollTo(0, 0));
    await frame.waitForSelector('.fx-tour-float[data-docked="false"]');
    assert(await float().isVisible());
    await float().getByRole('button', { name: 'Previous effect' }).click();
    await frame.waitForSelector('[data-card-effect="shatter"]');
    for (let i = 0; i < 4; i++) await float().getByRole('button', { name: 'Next effect' }).click();
    await frame.waitForSelector('[data-card-effect="lantern-reveal"]');
    assert(await hidden(), 'a concealing effect still conceals on the tour');
    await frame.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await frame.waitForSelector('.fx-tour-float[data-docked="true"]');
    assert(await float().isVisible(), 'the floating copy stays reachable while the footer is concealed');
    await float().getByRole('button', { name: 'Back to this card’s effect' }).click();
    await frame.waitForSelector('[data-card-effect="repel"]');
    assert.equal(await float().count(), 0);
    assert.equal(await revealed(), null);
    assert.equal(await frame.locator('[data-fx-content]').evaluate(el => el.inert), false);
    // The card's own effect is called out when the tour comes back around to it; "none" starts at the top.
    await dock().locator('button').click(); await frame.waitForSelector('[data-card-effect="shatter"]');
    await dock().getByRole('button', { name: 'Previous effect' }).click();
    assert.match(await dock().innerText(), /Repel[\s\S]*on this card/);
    await dock().getByRole('button', { name: 'Back to this card’s effect' }).click();
    await update('none', {}, false);
    await dock().locator('button').click(); await frame.waitForSelector('[data-card-effect="portal"]');
    await dock().getByRole('button', { name: 'Done' }).click(); await frame.waitForSelector('[data-card-effect="none"]');
    // Only a Pro owner can hide it; a stored false is ignored on a free card; reduced motion hides it.
    await update('repel', { effectTour: false }, true); assert.equal(await dock().count(), 0);
    await update('repel', { effectTour: false }, false); assert.equal(await dock().count(), 1);
    await update('repel', {}, true); assert.equal(await dock().count(), 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await update('repel', {}, false); assert.equal(await dock().count(), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await update('repel', {}, false); assert.equal(await dock().count(), 1); await shot('effects-tour');
    assert.deepEqual(errors, []);
    console.log('PASS: remaining effects, reveal gates, cancellation, cleanup, keyboard, reduced motion, entitlement fallback, and the effects tour.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
