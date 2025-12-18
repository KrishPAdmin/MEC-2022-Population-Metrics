# Imports
import pandas as pd
import mysql.connector
import numpy as np
import re

class processing () :
    db = None
    final_data = []

    def __init__(self) :
        self.connect_database()
        self.delete_tables()

    def connect_database(self) :
        # Connect to the database
        self.db = mysql.connector.connect(host="localhost", user="root", password="...", database="data")
        self.cursor = self.db.cursor(buffered=True)

    def delete_tables(self) :
        # Delete all tables
        self.cursor.execute("SHOW TABLES")
        tables = self.cursor.fetchall()
        for table in tables :
            self.cursor.execute(f'DROP TABLE {table[0]}')

    def create_table(self, name) :
        # Create a table for the country
        self.cursor.execute(f'CREATE TABLE {name} (id INT AUTO_INCREMENT PRIMARY KEY, Population INT, Growth FLOAT)')

    def read_excel(self) :
        file = 'Data_Set_to_be_used_in_Competition.xlsx'
        # Get the data from the excel file
        data = pd.read_excel(file, usecols = [2, 5, 11, 19, 21, 64])

        # Drop the rows with missing values (which are not countries)
        data = data.dropna()

        # Set the first row as the header
        data.columns = data.iloc[0]

        # Drop the first row
        data = data[1:]

        # Get number of rows
        rows = data.shape[0]

        # Set years
        year = []
        for i in range(72) :
            year.append(1950 + i)
        
        # Get the number countries
        number_of_countries = rows / len(year)

        # Loop, for each country
        for i in range (int(number_of_countries)) :
            # Get the country name
            country = re.sub('[^A-Za-z0-9]+', '_', data.iloc[i*72, 0])
            # Replace special characters with underscores

            # Create a table for the country
            self.create_table(country)

            # Create list for growth rate and migration
            growth_rate = []
            migration = []


            # Loop, for each year
            for j in range(72) :
                # Get the growth rate
                growth_rate.append(data.iloc[i*72 + j, 4])

                # Check if data is missing
                nat_change = data.iloc[i*72 + j, 3]
                mig_rate = data.iloc[i*72 + j, 5]

                if mig_rate != '...' and nat_change != '...' :
                    migration.append((data.iloc[i*72 + j, 3] + data.iloc[i*72 + j, 5])/10)
                else :
                    # If data is missing, set to growth rate
                    migration.append(data.iloc[i*72 + j, 4])

            # Get the slope and intercept for growth rate
            slope_growth_rate, intercept_growth_rate = self.line_best_fit(year, growth_rate)
            slope_migration, intercept_migration = self.line_best_fit(year, migration)

            # Average the growth rate and migration
            average_slope = (slope_growth_rate + slope_migration) / 2
            average_intercept = (intercept_growth_rate + intercept_migration) / 2

            # Add Population and growth of the known years (1950-2021) in the database
            for j in range(72) :
                self.cursor.execute(f'INSERT INTO {country} (Population, Growth) VALUES ({data.iloc[i*72 + j, 2]}, {data.iloc[i*72 + j, 4]})')
            # Add Population and growth of the unknow years (2022-2030) in the database
            last_pop = data.iloc[i*72 + 71, 2]
            for j in range(9) :
                # Calculate the population
                # Get the population of the last known year

                growth_rate = average_slope * (2022 + i) + average_intercept
                population = last_pop + last_pop * (growth_rate/100)
                last_pop = population
                self.cursor.execute(f'INSERT INTO {country} (Population, Growth) VALUES ({population}, {growth_rate})')
            
            self.final_data.append([country, average_slope * 2030 + average_intercept, last_pop])

    def line_best_fit(self, xVals, yVals):
        # Calculate the slope and intercept of the best fit line
        xVals = np.array(xVals)
        yVals = np.array(yVals)

        # Get the slope and intercept
        slope, intercept = np.polyfit(xVals, yVals, 1)
        return slope, intercept

    def sort_data(self) :
        # Sort the data
        self.final_data.sort(key = lambda x: x[1], reverse = True)
        
        self.cursor.execute(f'CREATE TABLE All_Data (id INT AUTO_INCREMENT PRIMARY KEY, name varchar(255), Growth FLOAT, Population INT)')
        # Add the data to the database
        for i in range(len(self.final_data)) :
            self.cursor.execute(f'INSERT INTO All_Data (name, Growth, Population) VALUES (\'{self.final_data[i][0]}\', {self.final_data[i][1]}, {self.final_data[i][2]})')
        
        self.cursor.execute(f'CREATE TABLE AAzAAAAA (id INT AUTO_INCREMENT PRIMARY KEY, name varchar(255), Growth FLOAT, Population INT)')


p = processing()
p.delete_tables()
p.read_excel()
p.sort_data()
