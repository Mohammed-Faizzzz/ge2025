import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime
import time


def get_branch_info(slug):
    url = f"https://www.pap.org.sg/representative/{slug}/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Getting branch info for: {slug}")
    res = requests.get(url, headers=headers)
    
    if res.status_code != 200:
        print(f"Failed to access {url}, status code: {res.status_code}")
        return None
        
    soup = BeautifulSoup(res.text, "html.parser")

    # Find associated GRC
    grc_h4 = soup.find("h4", string=lambda text: text and "GRC" in text if text else False)
    if grc_h4:
        return grc_h4.text.strip()
    # If not found, find asssociated SMC
    smc_h4 = soup.find("h4", string=lambda text: text and "SMC" in text if text else False)
    if smc_h4:
        return smc_h4.text.strip()
    
    # In case the above fails, try to find the branch name in a different way
    branch_h4 = soup.find("h4", string=lambda text: text and "Branch" in text if text else False)
    if branch_h4:
        return branch_h4.text.strip()

    branch_div = soup.find("div", class_="row")
    if branch_div:
        h4_tags = branch_div.find_all("h4")
        for h4 in h4_tags:
            if h4.text and ("GRC" in h4.text or "SMC" in h4.text):
                return h4.text.strip()
                
    # last resort
    constituency_element = soup.find(lambda tag: tag.name and "GRC" in tag.text or "SMC" in tag.text)
    if constituency_element:
        return constituency_element.text.strip()
        
    print(f"Could not find branch info for {slug}")
    return None

def scrape_pap_candidates():
    """Scrape PAP candidates from the representatives page dropdown"""
    url = "https://www.pap.org.sg/your-representatives/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print("Scraping PAP candidates from dropdown...")
    response = requests.get(url, headers=headers)
    candidates = []
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        # Find the dropdown with id 'by_rep'
        dropdown = soup.select_one('select#by_rep')
        if dropdown:
            option_elements = dropdown.select('option')
            for option in option_elements: # ie iterate over all candidates
                if option.get('value') == 'By Representative':
                    continue
                
                # Extract the candidate ID and name
                candidate_id = option.get('value')
                name = option.text.strip()

                time.sleep(3)  # cool down to avoid being blocked
                branch_info = get_branch_info(candidate_id)
                print(f"Branch info for {name}: {branch_info}")
                
                candidate_data = {
                    "full_name": name,
                    "party": "People's Action Party",
                    "branch": branch_info,
                    "url": f"https://www.pap.org.sg/your-representatives/{candidate_id}/"
                }
                
                candidates.append(candidate_data)
                print(f"Found candidate: {name}")
            
            print(f"Total candidates found: {len(candidates)}")
            
        else:
            print("Could not find the dropdown with id='by_rep'")
    else:
        print(f"Failed to access the website: {response.status_code}")
    
    return candidates


def main():
    data_folder = "election_data"
    if not os.path.exists(data_folder):
        os.makedirs(data_folder)
    
    candidates = scrape_pap_candidates()
    
    # Save the data
    data = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "candidates": candidates
    }
    
    output_file = os.path.join(data_folder, "pap_candidates.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Data saved to {output_file}")

if __name__ == "__main__":
    main()