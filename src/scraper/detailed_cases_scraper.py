import asyncio
from playwright.async_api import async_playwright

async def debug_final_table():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        await page.goto("https://samadhaan.msme.gov.in/", wait_until="networkidle")

        try:
            target_frame = next(f for f in page.frames if "Welcome" in f.url or "MSEFC" in f.url)
            
            # 1. Manually navigate or use the code to reach the screen in your screenshot
            print("Please navigate to the report in image_2e8676.png...")
            await asyncio.sleep(10) # Time for you to hit 'Search'

            # 2. Grab the first row that looks like data
            # We use a broad selector to find the first <td> that contains 'Mumbai'
            mumbai_row = target_frame.locator("tr:has-text('Mumbai')")
            
            if await mumbai_row.count() > 0:
                full_html = await mumbai_row.first.inner_html()
                print("\n--- RAW HTML FOR MUMBAI ROW ---")
                print(full_html)
                print("--- END HTML ---\n")
                
                if "href" in full_html or "onclick" in full_html:
                    print("Found a hidden link/event! We can drill down.")
                else:
                    print("No links found. This table is purely static text.")
            else:
                print("Could not find the Mumbai row. Is the table loaded?")

        except Exception as e:
            print(f"Debug Error: {e}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_final_table())