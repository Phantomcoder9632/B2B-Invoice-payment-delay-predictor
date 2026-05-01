import asyncio
import pandas as pd
from playwright.async_api import async_playwright
from config.settings import RAW_DATA

async def master_report_discovery():
    async with async_playwright() as p:
        # Launch browser - headless=False so you can watch it work
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        print("Navigating to MSME Samadhaan...")
        await page.goto("https://samadhaan.msme.gov.in/", wait_until="networkidle")

        discovery_results = []

        try:
            # 1. Identify the interactive frame
            target_frame = None
            for f in page.frames:
                if await f.locator("text='Factsheets'").is_visible():
                    target_frame = f
                    break
            
            if not target_frame:
                print("Error: Could not find the interactive frame.")
                return

            # 2. Extract all report names from the dropdown
            await target_frame.click("text='Factsheets'")
            # Target links inside the dropdown menu
            menu_items = await target_frame.locator(".dropdown-menu a, .dropdown-content a").all()
            report_names = [await item.inner_text() for item in menu_items]
            print(f"Found {len(report_names)} reports to analyze.")

            # 3. Iterate through each report
            for name in report_names:
                name = name.strip()
                if not name or "NEW" in name: # Skipping 'NEW' badges if they are separate text
                    name = name.replace("NEW", "").strip()

                print(f"\n[Testing] {name}...")
                
                try:
                    # Re-open menu and click the specific report
                    await target_frame.click("text='Factsheets'")
                    await target_frame.click(f"text='{name}'")
                    
                    # Wait for potential ASP.NET postback or navigation
                    await asyncio.sleep(3) 
                    
                    # Analyze headers
                    headers = await target_frame.locator("th").all_inner_texts()
                    headers = [h.strip() for h in headers if h.strip()]
                    
                    # Decision Logic: Does it have what we need?
                    has_date = any("date" in h.lower() for h in headers)
                    has_app_no = any("app" in h.lower() or "case" in h.lower() for h in headers)
                    is_granular = has_date or has_app_no
                    
                    verdict = "GOLD MINE (Granular)" if is_granular else "Aggregate (Summary)"
                    if not headers:
                        verdict = "Requires Input (Dropdowns/Filters)"

                    discovery_results.append({
                        "Report Name": name,
                        "Verdict": verdict,
                        "Headers Found": ", ".join(headers)
                    })
                    
                    print(f"Verdict: {verdict}")

                except Exception as e:
                    print(f"Failed to analyze {name}: {e}")
                    discovery_results.append({"Report Name": name, "Verdict": "Error/Timeout", "Headers Found": ""})

            # 4. Export Findings
            discovery_df = pd.DataFrame(discovery_results)
            output_path = RAW_DATA / "report_discovery_log.csv"
            discovery_df.to_csv(output_path, index=False)
            print(f"\nMaster Discovery Complete. Results saved to {output_path}")

        except Exception as e:
            print(f"Critical Scraper Error: {e}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(master_report_discovery())