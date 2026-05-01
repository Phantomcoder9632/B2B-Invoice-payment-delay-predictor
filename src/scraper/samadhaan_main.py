import asyncio
import pandas as pd
from playwright.async_api import async_playwright
from config.settings import RAW_DATA

async def scrape_central_psu_summary():
    async with async_playwright() as p:
        # Launch browser (headless=True for speed, change to False to watch)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("Navigating to MSME Samadhaan...")
        await page.goto("https://samadhaan.msme.gov.in/", wait_until="networkidle")

        try:
            # 1. Locate the correct frame that contains the Factsheets menu
            target_frame = None
            for f in page.frames:
                if await f.locator("text='Factsheets'").is_visible():
                    target_frame = f
                    break
            
            if not target_frame:
                print("Error: Could not find the interactive frame.")
                return

            # 2. Navigate: Factsheets -> Central PSU
            print("Accessing Factsheets -> Central PSU Report...")
            await target_frame.click("text='Factsheets'")
            await target_frame.click("text='Central PSU'")
            
            # Wait for the table to fully render
            await target_frame.wait_for_selector("table", timeout=20000)
            print("Table loaded. Extracting data...")

            # 3. Extract Table Data
            # Scrape headers
            headers = await target_frame.locator("th").all_inner_texts()
            headers = [h.strip() for h in headers if h.strip()]

            # Scrape rows
            rows = await target_frame.locator("table tr").all()
            data = []

            # Starting from index 1 to skip the header row
            for row in rows[1:]:
                cols = await row.locator("td").all_inner_texts()
                if cols and len(cols) >= 9:
                    data.append(cols[:len(headers)])

            # 4. Save to CSV
            if data:
                df = pd.DataFrame(data, columns=headers)
                output_path = RAW_DATA / "central_psu_summary.csv"
                df.to_csv(output_path, index=False)
                print(f"Success! Fetched {len(df)} companies and saved to {output_path}")
            else:
                print("No data rows found in the table.")

        except Exception as e:
            print(f"Scraper Error: {e}")
        
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_central_psu_summary())