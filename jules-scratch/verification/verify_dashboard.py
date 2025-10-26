# jules-scratch/verification/verify_dashboard.py
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to the dashboard page
    page.goto("http://localhost:3000")

    # Wait for the heading to be visible, to ensure the page has loaded
    expect(page.get_by_role("heading", name="Hello, Student!")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/dashboard-final-preview.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
