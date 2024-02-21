import requests
from bs4 import BeautifulSoup
import csv

# Send a GET request to the URL
response = requests.get('https://docs.legis.wisconsin.gov/2023/legislators/assembly?sort=district')

# Parse the HTML content of the page
soup = BeautifulSoup(response.content, 'html.parser')

# Find all img elements with the class 'picture'
images = soup.find_all('img', class_='picture')

# Create a CSV writer
with open('images.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    # Write the headers
    writer.writerow(['district', 'alttext', 'imageURL'])
    
    # For each img element
    for i, img in enumerate(images, start=1):
        # Extract the 'alt' and 'src' attributes
        alt_text = img.get('alt')
        image_url = img.get('src')
        
        # Write a new row to the CSV file
        writer.writerow([i, alt_text, image_url])
