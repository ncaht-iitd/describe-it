import os
import pandas as pd
import asyncio
import requests

def get_fig_no(file_path):
    return os.path.splitext(os.path.basename(file_path))[0].split('fig')[1]

def call_api(file_path, subject, standard, book, chapter, description):
    url = "http://localhost:5000/upload"
    
    with open(file_path, 'rb') as file:
        files = {'file': (os.path.basename(file_path), file, 'image/png')}
        data = {
            'subject': subject,
            'standard': standard,
            'book': book,
            'chapter': chapter,
            'description': description,
            'fig_no': get_fig_no(file_path)
        }
    
        try:
            response = requests.post(url, files=files, data=data)
            return response.status_code
        except requests.RequestException as err:
            print(f"An error occurred: {err}")
            return None

# Read the Excel file
excel_path = "online-image-library/final-img-descriptions.xlsx"
df = pd.read_excel(excel_path)

# Specify the folder path where the files are located
folder_path = 'online-image-library/server/upload'

async def process_files():
    for index, row in df.iterrows():
        file_id = row['Image_ID']
        subject = 'Mathematics'
        standard = 'Class 7'
        book = 'NCERT'
        chapter = row['Chapter']
        description = row['Description']
        
        file_path = os.path.join(folder_path, f"{file_id}")
        
        if os.path.exists(file_path):
            print(f"Processing file: {file_id}")
            
            status_code = await asyncio.to_thread(call_api, file_path, subject, standard, book, chapter, description)
            
            if status_code == 200:
                print(f"Successfully processed file {file_id}")
            else:
                print(f"Failed to process file {file_id}. Status code: {status_code}")
            
            await asyncio.sleep(1)
        else:
            print(f"File not found: {file_id}")

    print("Processing complete")

asyncio.run(process_files())