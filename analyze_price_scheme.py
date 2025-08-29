import pandas as pd
import json

def analyze_price_scheme():
    """Analyze the PriceScheme.xls file structure"""
    try:
        # Read the Excel file
        df = pd.read_html('PriceScheme.xls')[0]
        print('Excel file structure:')
        print(f'Total records: {len(df)}')
        print(f'Columns: {list(df.columns)}')
        print()
        
        # Analyze unique values
        print('Unique Departments:')
        unique_depts = df['Dept_Name'].unique()
        print(f'Count: {len(unique_depts)}')
        for dept in sorted(unique_depts):
            print(f'  - {dept}')
        print()
        
        print('Unique Schemes:')
        unique_schemes = df[['Scheme_Code', 'Scheme_Name']].drop_duplicates()
        print(f'Count: {len(unique_schemes)}')
        for _, row in unique_schemes.iterrows():
            scheme_code = row['Scheme_Code']
            scheme_name = row['Scheme_Name']
            print(f'  - {scheme_code}: {scheme_name}')
        print()
        
        print('Test Types:')
        unique_types = df['Test_Type'].unique()
        for test_type in unique_types:
            count = len(df[df['Test_Type'] == test_type])
            print(f'  - {test_type}: {count} records')
        print()
        
        # Sample records
        print('Sample records:')
        for i in range(min(5, len(df))):
            row = df.iloc[i]
            test_name = row['Test_Name']
            dept_name = row['Dept_Name']
            scheme_name = row['Scheme_Name']
            test_amount = row['Test_Amount']
            old_amount = row['Old_Amount']
            spl_amount = row['Spl_Amount']
            print(f'  {i+1}. {test_name} | Dept: {dept_name} | Scheme: {scheme_name} | Amount: {test_amount} | Old: {old_amount} | Spl: {spl_amount}')
        
        # Price analysis
        print()
        print('Price Analysis:')
        print(f'Test_Amount range: {df["Test_Amount"].min()} - {df["Test_Amount"].max()}')
        print(f'Old_Amount range: {df["Old_Amount"].min()} - {df["Old_Amount"].max()}')
        print(f'Spl_Amount range: {df["Spl_Amount"].min()} - {df["Spl_Amount"].max()}')
        
        # Create sample data structure
        print()
        print('Creating sample data structure...')
        
        # Extract unique schemes for master data
        schemes = []
        for _, row in unique_schemes.iterrows():
            schemes.append({
                'id': len(schemes) + 1,
                'scheme_code': row['Scheme_Code'],
                'scheme_name': row['Scheme_Name'],
                'is_active': True,
                'created_at': '2025-01-01T00:00:00',
                'updated_at': '2025-01-01T00:00:00'
            })
        
        # Create price scheme entries (sample)
        price_schemes = []
        for i, row in df.head(10).iterrows():  # First 10 records as sample
            price_schemes.append({
                'id': i + 1,
                'dept_code': row['Dept_Code'],
                'dept_name': row['Dept_Name'],
                'scheme_code': row['Scheme_Code'],
                'scheme_name': row['Scheme_Name'],
                'test_type': row['Test_Type'],
                'test_code': row['Test_Code'],
                'test_name': row['Test_Name'],
                'default_price': float(row['Test_Amount']),
                'old_price': float(row['Old_Amount']),
                'special_price': float(row['Spl_Amount']),
                'price_percentage': round(((float(row['Old_Amount']) / float(row['Test_Amount'])) * 100), 2) if float(row['Test_Amount']) > 0 else 0,
                'is_active': True,
                'created_at': '2025-01-01T00:00:00',
                'updated_at': '2025-01-01T00:00:00'
            })
        
        # Save sample data
        with open('schemes_master.json', 'w') as f:
            json.dump(schemes, f, indent=2)
        
        with open('price_scheme_master.json', 'w') as f:
            json.dump(price_schemes, f, indent=2)
        
        print(f'Created schemes_master.json with {len(schemes)} schemes')
        print(f'Created price_scheme_master.json with {len(price_schemes)} price entries')
        
        return df
        
    except Exception as e:
        print(f'Error reading Excel file: {e}')
        return None

if __name__ == '__main__':
    analyze_price_scheme()
