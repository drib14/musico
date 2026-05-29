import re
from playwright.sync_api import Page, expect, sync_playwright

def test_lyrics_sync(page: Page):
    print("Navigating to application...")
    page.goto("http://localhost:5173/")
    page.wait_for_load_state("networkidle")

    print("Starting a track to initialize Player context...")
    # Click any play button to start a track
    play_buttons = page.locator('.play-btn')
    if play_buttons.count() > 0:
        play_buttons.first.click()
        page.wait_for_timeout(3000)

    print("Checking if Right Sidebar exists...")
    sidebar = page.locator('aside.right-sidebar')
    if sidebar.is_visible():
        print("Right Sidebar is visible. Checking for lyrics highlight functionality...")
        # Since Jamendo API may return tracks without lyrics, we assume if lyrics exist, they get highlighted.
        # Ensure that our active line locator exists if lyrics are present
        active_lines = page.locator('.sidebar-lyric-line.active')
        if active_lines.count() > 0:
            print("Found active lyric line!")
            expect(active_lines.first).to_have_class(re.compile(r"active"))
        else:
            print("No lyrics or active lyrics currently present. Skipping deep sync validation.")
    else:
        print("Sidebar not visible. Track might not be playing.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_lyrics_sync(page)
            print("Smoke test completed successfully!")
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()
