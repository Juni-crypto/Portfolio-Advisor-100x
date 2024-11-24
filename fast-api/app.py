import os
import requests
import json
import csv
import uuid
from datetime import datetime, timedelta
import urllib.parse
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware  # Import CORSMiddleware

# === Security Best Practice: Use Environment Variables for API Keys ===
load_dotenv()

# Ensure your .env file or environment variables contain the following keys
lyzr_api_key = os.getenv("LYZR_API_KEY")
twelvedata_api_key = os.getenv("TWELVEDATA_API_KEY")
GENAI_API_KEY = os.getenv("GENAI_API_KEY") 
agent_id = os.getenv("AGENT_ID")  # Replace with your actual agent ID or set via environment variable

if not all([lyzr_api_key, twelvedata_api_key, GENAI_API_KEY, agent_id]):
    raise EnvironmentError("Missing API keys or agent ID. Please set LYZR_API_KEY, TWELVEDATA_API_KEY, GENAI_API_KEY, and AGENT_ID in your environment.")

# === Configure the Gemini API Client ===
genai.configure(api_key=GENAI_API_KEY)

# Headers for Lyzr API requests
headers = {
    "Content-Type": "application/json",
    "x-api-key": lyzr_api_key
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Allows all origins
    allow_credentials=True,         # Allows cookies and authentication
    allow_methods=["*"],            # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # Allows all headers
)

class UserProfile(BaseModel):
    risk_tolerance: str
    financial_goals: list
    timeline: list
    income: str
    expenses: str
    savings: str
    debt_levels: str

def get_api_parameters(agent_id, user_id, session_id, user_input):
    url = "https://agent.api.lyzr.app/v2/chat/"
    payload = {
        "user_id": user_id,
        "agent_id": agent_id,
        "session_id": session_id,
        "message": user_input
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None
    
    if response.status_code == 200:
        try:
            response_json = response.json()
            # Access the 'response' key
            output = response_json.get("response", "")
            # Parse the JSON-formatted string
            params = json.loads(output)
            return params
        except json.JSONDecodeError:
            print("Failed to parse JSON output.")
            return None
    else:
        print(f"Error during conversation: {response.status_code} - {response.text}")
        return None

def fetch_mutual_funds(api_parameters):
    api_endpoint = "https://api.twelvedata.com/mutual_funds/list"
    # Add the Twelve Data API key to the parameters
    api_parameters["apikey"] = twelvedata_api_key

    try:
        response = requests.get(api_endpoint, params=api_parameters)
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return None

    if response.status_code == 200:
        try:
            funds_list = response.json()
            return funds_list
        except json.JSONDecodeError:
            print("Failed to parse mutual funds JSON response.")
            return None
    else:
        print(f"Error fetching mutual funds: {response.status_code} - {response.text}")
        return None

def get_scheme_code(fund_name):
    query = urllib.parse.quote(fund_name)
    search_url = f'https://api.mfapi.in/mf/search?q={query}'
    try:
        response = requests.get(search_url)
        if response.status_code == 200:
            schemes = response.json()
            if schemes:
                # Attempt to find the best match
                fund_name_lower = fund_name.lower()
                best_match = None
                for scheme in schemes:
                    scheme_name = scheme['schemeName']
                    if scheme_name.lower() == fund_name_lower:
                        best_match = scheme
                        break
                if not best_match:
                    # No exact match, pick the first one
                    best_match = schemes[0]
                return best_match['schemeCode']
            else:
                print(f"No schemes found for fund name: {fund_name}")
                return None
        else:
            print(f"Error fetching scheme code: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def get_fund_data(scheme_code):
    url = f'https://api.mfapi.in/mf/{scheme_code}'
    try:
        response = requests.get(url)
        if response.status_code == 200:
            fund_data = response.json()
            return fund_data
        else:
            print(f"Error fetching fund data for scheme code {scheme_code}: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def get_nav_data_one_year(fund_data):
    nav_data = fund_data.get('data', [])
    one_year_ago = datetime.now() - timedelta(days=1825)
    nav_data_one_year = []
    for entry in nav_data:
        date_str = entry['date']
        try:
            date_obj = datetime.strptime(date_str, '%d-%m-%Y')
        except ValueError:
            print(f"Invalid date format: {date_str}")
            continue
        if date_obj >= one_year_ago:
            nav_data_one_year.append(entry)
        else:
            break  # Since data is usually in reverse chronological order
    return nav_data_one_year

def format_nav_data(nav_entries):
    try:
        return json.dumps(nav_entries)
    except (TypeError, ValueError):
        return json.dumps([])  # Return empty list if serialization fails

def upload_csv_file(file_path):
    try:
        uploaded_file = genai.upload_file(file_path, mime_type='text/csv')
        print(f"File uploaded successfully. File name: {uploaded_file.name}")
        return uploaded_file
    except Exception as e:
        print(f"An error occurred during file upload: {e}")
        return None

def chat_with_csv(prompt, uploaded_file):
    try:
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = model.generate_content([prompt, uploaded_file])
        return response.text
    except Exception as e:
        print(f"An error occurred during content generation: {e}")
        return None
def create_ai_prompt(user_profile):
    prompt = (
        "You are a highly knowledgeable financial advisor specializing in creating personalized investment portfolios. "
        "Based on the client's detailed financial profile and the provided mutual funds data in the attached CSV file, "
        "generate comprehensive investment recommendations in a structured JSON format that will be used to power an interactive dashboard. "
        "The recommendations should include detailed historical performance metrics, risk analysis, and future projections.\n\n"
        
        "### Important Notes:\n"
        "- **All fields must be populated with calculated values; do not leave any fields null or empty.**\n"
        "- Perform necessary calculations using the 5 years of NAV data provided in the CSV file.\n"
        "- Use appropriate financial formulas to compute returns, standard deviation, Sharpe ratio, projections, etc.\n"
        "- If any data is missing, make reasonable and justifiable estimates based on available information.\n\n"
        
        "### JSON Schema:\n"
        "{\n"
        "  \"Investment_Actions\": [\n"
        "    {\n"
        "      \"Action\": \"<Brief, actionable title>\",\n"
        "      \"Details\": \"<Detailed explanation with specific numbers and rationale>\",\n"
        "      \"Priority\": \"<High/Medium/Low>\",\n"
        "      \"Timeline\": \"<Immediate/Short-term/Long-term>\",\n"
        "      \"Expected_Impact\": \"<Quantified impact on portfolio>\",\n"
        "      \"Associated_Strategies\": [\"<List of related diversification strategies>\"]\n"
        "    }\n"
        "  ],\n"
        
        "  \"Top_Mutual_Funds\": [\n"
        "    {\n"
        "      \"Fund_Name\": \"<Full fund name>\",\n"
        "      \"Scheme_Code\": \"<Scheme code>\",\n"
        "      \"Fund_House\": \"<Fund house name>\",\n"
        "      \"Scheme_Type\": \"<Type>\",\n"
        "      \"Scheme_Category\": \"<Category>\",\n"
        "      \"Performance_Rating\": \"<1-5 rating>\",\n"
        "      \"Risk_Rating\": \"<1-5 rating>\",\n"
        "      \"Currency\": \"<Currency code>\",\n"
        "      \"Exchange\": \"<Exchange name>\",\n"
        "      \"MIC_Code\": \"<Market identifier code>\",\n"
        "      \"Latest_NAV\": \"<Current NAV>\",\n"
        "      \"Historical_Returns\": [\n"
        "        {\n"
        "          \"Time_Period\": \"1Y\",\n"
        "          \"Return_Percentage\": \"<Calculated 1-year return>\"\n"
        "        },\n"
        "        {\n"
        "          \"Time_Period\": \"3Y\",\n"
        "          \"Return_Percentage\": \"<Calculated 3-year return>\"\n"
        "        },\n"
        "        {\n"
        "          \"Time_Period\": \"5Y\",\n"
        "          \"Return_Percentage\": \"<Calculated 5-year return>\"\n"
        "        }\n"
        "      ],\n"
        "      \"Expense_Ratio\": \"<Expense ratio of the fund>\",\n"
        "      \"AUM\": \"<Assets Under Management>\"\n"
        "    }\n"
        "  ],\n"
        
        "  \"Diversification_Strategies\": [\n"
        "    {\n"
        "      \"Strategy\": \"<Name of the diversification strategy>\",\n"
        "      \"Description\": \"<Detailed description of the strategy>\",\n"
        "      \"Benefits\": \"<Benefits of implementing this strategy>\",\n"
        "      \"Recommended_Allocation\": \"<Suggested percentage allocation>\",\n"
        "      \"Supported_Funds\": [\n"
        "        {\n"
        "          \"Scheme_Code\": \"<Scheme code>\",\n"
        "          \"Fund_Name\": \"<Full fund name>\",\n"
        "          \"Allocation_Percentage\": \"<Allocation percentage for this fund>\",\n"
        "          \"Key_Metrics\": {\n"
        "            \"1Y_Return\": \"<Calculated 1-year return>\",\n"
        "            \"3Y_Return\": \"<Calculated 3-year return>\",\n"
        "            \"5Y_Return\": \"<Calculated 5-year return>\",\n"
        "            \"Standard_Deviation\": \"<Calculated standard deviation of returns>\",\n"
        "            \"Sharpe_Ratio\": \"<Calculated Sharpe ratio>\"\n"
        "          }\n"
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
        
        "  \"Sample_Investment_Plan\": {\n"
        "    \"Initial_Investment\": \"<Total amount to invest>\",\n"
        "    \"Allocation\": [\n"
        "      {\n"
        "        \"Fund_Name\": \"<Name of the mutual fund>\",\n"
        "        \"Scheme_Code\": \"<Scheme code>\",\n"
        "        \"Investment_Amount\": \"<Amount allocated>\",\n"
        "        \"Percentage\": \"<Allocation percentage>\",\n"
        "        \"Projected_Returns\": \"<Calculated expected returns>\",\n"
        "        \"Investment_Strategy\": \"<Associated diversification strategy>\"\n"
        "      }\n"
        "    ],\n"
        "    \"Growth_Projection\": [\n"
        "      {\n"
        "        \"Year\": \"<Year number>\",\n"
        "        \"Projected_Value\": \"<Calculated value based on growth projections>\",\n"
        "        \"Best_Case\": \"<Calculated best case value>\",\n"
        "        \"Worst_Case\": \"<Calculated worst case value>\",\n"
        "        \"Expected_Return\": \"<Calculated return percentage>\",\n"
        "        \"CAGR\": \"<Calculated Compound Annual Growth Rate>\"\n"
        "      }\n"
        "    ]\n"
        "  },\n"
        
        "  \"Market_Trends\": [\n"
        "    {\n"
        "      \"Trend\": \"<Identified market trend>\",\n"
        "      \"Analysis\": \"<Detailed analysis using data>\",\n"
        "      \"Impact\": \"<Impact on the recommended investments>\",\n"
        "      \"Direction\": \"<Positive/Negative/Neutral>\",\n"
        "      \"Confidence\": \"<High/Medium/Low based on data>\",\n"
        "      \"Supporting_Data\": [\n"
        "        {\n"
        "          \"Metric\": \"<Related metric>\",\n"
        "          \"Value\": \"<Calculated value>\",\n"
        "          \"Change\": \"<Calculated percentage change>\",\n"
        "          \"Date\": \"<Relevant date>\"\n"
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
    
        "  \"Risk_Assessment\": [\n"
        "    {\n"
        "      \"Risk\": \"<Identified risk>\",\n"
        "      \"Category\": \"<Market/Credit/Liquidity/Operational>\",\n"
        "      \"Severity\": \"<High/Medium/Low>\",\n"
        "      \"Probability\": \"<High/Medium/Low>\",\n"
        "      \"Impact_Score\": \"<Calculated on a scale of 1-10>\",\n"
        "      \"Assessment\": \"<Detailed assessment based on data>\",\n"
        "      \"Mitigation_Strategies\": \"<Specific strategies to mitigate risk>\",\n"
        "      \"Associated_Funds\": [\n"
        "        {\n"
        "          \"Scheme_Code\": \"<Scheme code>\",\n"
        "          \"Fund_Name\": \"<Full fund name>\"\n"
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
    
        "  \"Projected_Outcomes\": [\n"
        "    {\n"
        "      \"Time_Horizon\": \"<Time frame>\",\n"
        "      \"Projected_Return\": \"<Calculated return percentage>\",\n"
        "      \"Details\": \"<Detailed explanation based on calculations>\",\n"
        "      \"Assumptions\": \"<Any assumptions made during calculations>\",\n"
        "      \"Risk_Adjusted_Return\": \"<Calculated risk-adjusted return percentage>\"\n"
        "    }\n"
        "  ],\n"
    
        "  \"Justifications\": [\n"
        "    {\n"
        "      \"Title\": \"<Title of the justification>\",\n"
        "      \"Details\": \"<Detailed justification for recommendations based on data and calculations>\",\n"
        "      \"Associated_Funds\": [\n"
        "        {\n"
        "          \"Scheme_Code\": \"<Scheme code>\",\n"
        "          \"Fund_Name\": \"<Full fund name>\"\n"
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
    
        "### Client's Financial Profile:\n"
        f"Risk Tolerance: {user_profile['Risk Tolerance']}\n"
        f"Financial Goals: {', '.join(user_profile['Financial Goals'])}\n"
        f"Investment Timeline: {', '.join(user_profile['Timeline'])}\n"
        f"Monthly Income: ₹{user_profile['Income']}\n"
        f"Monthly Expenses: ₹{user_profile['Expenses']}\n"
        f"Total Savings: ₹{user_profile['Savings']}\n"
        f"Total Debt: ₹{user_profile['Debt Levels']}\n\n"
    
        "### Instructions:\n"
        "1. **Use only the data provided in the CSV file** for mutual fund recommendations and all calculations.\n"
        "2. **All fields must be filled**; do not leave any fields null or empty.\n"
        "3. **Calculate** the \"1Y_Return\", \"3Y_Return\", and \"5Y_Return\" using the 5 years of NAV data from the CSV. Use appropriate formulas for CAGR.\n"
        "4. **Compute** the \"Standard_Deviation\" and \"Sharpe_Ratio\" for each fund using the NAV data.\n"
        "5. Ensure all fund recommendations match the client's risk profile.\n"
        "6. In 'Supported_Funds' under 'Diversification_Strategies', include both scheme codes and full fund names, and provide detailed key metrics for each fund.\n"
        "7. Provide multiple diversification strategies (at least three) relevant to the client's profile.\n"
        "8. Introduce new fields if they offer valuable insights for the dashboard, such as fund expense ratios, AUM, or performance metrics.\n"
        "9. Provide detailed growth projections with realistic best and worst-case scenarios, including CAGR calculations.\n"
        "10. Include comprehensive risk assessments with specific mitigation strategies, linking associated funds where applicable.\n"
        "11. All numerical values must be properly calculated, formatted, and statistically sound.\n"
        "12. **Do not include placeholders or indicate limitations**; perform all necessary calculations and provide results.\n"
        "13. The response must be in valid JSON format without any additional text outside the JSON.\n"
    )
    return prompt
def format_response_to_json(response_text: str) -> dict:
    try:
        if response_text.startswith("```json") and response_text.endswith("```"):
            json_str = response_text[len("```json"): -len("```")].strip()
        else:
            json_str = response_text
        response_json = json.loads(json_str)
        required_fields = ["Investment_Actions", "Top_Mutual_Funds", "Diversification_Strategies",
                           "Sample_Investment_Plan", "Market_Trends", "Justifications",
                           "Risk_Assessment", "Projected_Outcomes"]
        for field in required_fields:
            if field not in response_json or not response_json[field]:
                response_json[field] = [{}] if field != "Sample_Investment_Plan" else {}
        return response_json
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON response from AI.")

@app.post("/get-predictions")
def get_predictions(user_profile: UserProfile):
    # Create a user profile dictionary
    user_profile_dict = {
        "Risk Tolerance": user_profile.risk_tolerance,
        "Financial Goals": user_profile.financial_goals,
        "Timeline": user_profile.timeline,
        "Income": user_profile.income,
        "Expenses": user_profile.expenses,
        "Savings": user_profile.savings,
        "Debt Levels": user_profile.debt_levels
    }

    # Combine user profile into a single input string
    user_input = (
        f"I am an investor from India with a {user_profile.risk_tolerance.lower()} risk tolerance. "
        f"My financial goals are {', '.join(user_profile.financial_goals)} and my investment timeline is {', '.join(user_profile.timeline)}. "
        f"My monthly income is {user_profile.income}, expenses are {user_profile.expenses}, total savings are {user_profile.savings}, "
        f"and I have a total debt of {user_profile.debt_levels}."
    )

    # Generate unique user ID and session ID
    user_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())

    # Use the agent to get API parameters
    api_parameters = get_api_parameters(agent_id, user_id, session_id, user_input)

    # Set country to India explicitly
    if api_parameters:
        api_parameters['country'] = 'India'
    else:
        raise HTTPException(status_code=500, detail="Failed to get API parameters.")

    print("\nExtracted API Parameters:")
    print(api_parameters)

    # Validate extracted parameters
    if not api_parameters:
        raise HTTPException(status_code=500, detail="Failed to get API parameters.")

    # Optional: Validate required parameters
    required_keys = ['country', 'performance_rating', 'risk_rating']
    for key in required_keys:
        if key not in api_parameters:
            raise HTTPException(status_code=400, detail=f"Missing required parameter: {key}")

    # Make the API call to fetch mutual funds
    funds_list = fetch_mutual_funds(api_parameters)
    if funds_list and 'result' in funds_list and 'list' in funds_list['result']:
        funds_data = funds_list['result']['list']  # Access the correct keys
        # Prepare to write to CSV
        csv_filename = f'funds_data_{uuid.uuid4()}.csv'
        with open(csv_filename, mode='w', newline='', encoding='utf-8') as csv_file:
            fieldnames = [
                'symbol', 'name', 'country', 'fund_family', 'fund_type',
                'performance_rating', 'risk_rating', 'currency', 'exchange', 'mic_code',
                'schemeCode', 'fund_house', 'scheme_type', 'scheme_category', 'scheme_name', 'nav_data'
            ]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
            writer.writeheader()
            # Process each fund
            for fund in funds_data:
                fund_name = fund['name']
                print(f"Processing fund: {fund_name}")
                scheme_code = get_scheme_code(fund_name)
                if scheme_code:
                    fund['schemeCode'] = scheme_code
                    fund_data = get_fund_data(scheme_code)
                    if fund_data:
                        meta = fund_data.get('meta', {})
                        fund['fund_house'] = meta.get('fund_house', 'N/A')
                        fund['scheme_type'] = meta.get('scheme_type', 'N/A')
                        fund['scheme_category'] = meta.get('scheme_category', 'N/A')
                        fund['scheme_name'] = meta.get('scheme_name', 'N/A')
                        nav_data = get_nav_data_one_year(fund_data)
                        # Convert NAV data to JSON string
                        fund['nav_data'] = format_nav_data(nav_data)
                    else:
                        fund['fund_house'] = 'N/A'
                        fund['scheme_type'] = 'N/A'
                        fund['scheme_category'] = 'N/A'
                        fund['scheme_name'] = 'N/A'
                        fund['nav_data'] = json.dumps([])
                    
                    # Write the fund_row to CSV
                    writer.writerow(fund)
                    print(f"Fund '{fund_name}' processed and added to the CSV file.")
                else:
                    print(f"Skipping fund '{fund_name}' as no schemeCode was found.")
        print(f"Data saved to {csv_filename}")

        # Now, proceed to upload the CSV file to GenAI
        print("\nUploading the CSV file to the AI model...")
        uploaded_file = upload_csv_file(csv_filename)

        if not uploaded_file:
            raise HTTPException(status_code=500, detail="File upload failed.")

        print("\nAnalyzing your financial profile and investment options...")

        # Generate the AI prompt with user inputs
        prompt = create_ai_prompt(user_profile_dict)

        # Get AI response
        answer = chat_with_csv(prompt, uploaded_file)
        if answer:
            return {"recommendations": answer}
        else:
            raise HTTPException(status_code=500, detail="Failed to get a response from the AI.")
    else:
        raise HTTPException(status_code=500, detail="No funds data found in the API response.")

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8080)
