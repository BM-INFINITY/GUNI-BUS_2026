const mongoose = require('mongoose');
require('dotenv').config();

const Route = require('./models/Route');

const routes = [
    {
        routeName: 'Ahmedabad City Route',
        routeNumber: 'AMD-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Maninagar Railway Station', coordinates: { latitude: 23.0030, longitude: 72.6020 }, arrivalTime: '08:30' },
                    { name: 'Ellis Bridge', coordinates: { latitude: 23.0216, longitude: 72.5797 }, arrivalTime: '08:45' },
                    { name: 'SG Highway', coordinates: { latitude: 23.0458, longitude: 72.5390 }, arrivalTime: '09:00' },
                    { name: 'Paldi Bus Stand', coordinates: { latitude: 23.0165, longitude: 72.5659 }, arrivalTime: '09:15' },
                    { name: 'Vastrapur Lake', coordinates: { latitude: 23.0395, longitude: 72.5257 }, arrivalTime: '09:30' },
                    { name: 'Thaltej Cross Road', coordinates: { latitude: 23.0546, longitude: 72.5136 }, arrivalTime: '09:45' },
                    { name: 'ISRO Circle', coordinates: { latitude: 23.0677, longitude: 72.5006 }, arrivalTime: '10:00' },
                    { name: 'Bodakdev Bus Stand', coordinates: { latitude: 23.0358, longitude: 72.5334 }, arrivalTime: '10:15' },
                    { name: 'University Area', coordinates: { latitude: 23.0252, longitude: 72.5075 }, arrivalTime: '10:30' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:45' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Maninagar Railway Station', coordinates: { latitude: 23.0030, longitude: 72.6020 }, arrivalTime: '11:40' },
                    { name: 'Ellis Bridge', coordinates: { latitude: 23.0216, longitude: 72.5797 }, arrivalTime: '11:55' },
                    { name: 'SG Highway', coordinates: { latitude: 23.0458, longitude: 72.5390 }, arrivalTime: '12:10' },
                    { name: 'Paldi Bus Stand', coordinates: { latitude: 23.0165, longitude: 72.5659 }, arrivalTime: '12:25' },
                    { name: 'Vastrapur Lake', coordinates: { latitude: 23.0395, longitude: 72.5257 }, arrivalTime: '12:40' },
                    { name: 'Thaltej Cross Road', coordinates: { latitude: 23.0546, longitude: 72.5136 }, arrivalTime: '12:55' },
                    { name: 'ISRO Circle', coordinates: { latitude: 23.0677, longitude: 72.5006 }, arrivalTime: '13:10' },
                    { name: 'Bodakdev Bus Stand', coordinates: { latitude: 23.0358, longitude: 72.5334 }, arrivalTime: '13:25' },
                    { name: 'University Area', coordinates: { latitude: 23.0252, longitude: 72.5075 }, arrivalTime: '13:40' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:55' }
                ]
            }
        ],
        startPoint: 'Maninagar Railway Station',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Gandhinagar Route',
        routeNumber: 'GNR-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Gandhinagar Bus Stand', coordinates: { latitude: 23.2156, longitude: 72.6369 }, arrivalTime: '08:30' },
                    { name: 'Sector 1 Circle', coordinates: { latitude: 23.2200, longitude: 72.6400 }, arrivalTime: '08:42' },
                    { name: 'Akshardham Temple', coordinates: { latitude: 23.2495, longitude: 72.6603 }, arrivalTime: '08:54' },
                    { name: 'Sector 11 Market', coordinates: { latitude: 23.2350, longitude: 72.6450 }, arrivalTime: '09:06' },
                    { name: 'Infocity', coordinates: { latitude: 23.2385, longitude: 72.6288 }, arrivalTime: '09:18' },
                    { name: 'Kudasan Circle', coordinates: { latitude: 23.1780, longitude: 72.6389 }, arrivalTime: '09:30' },
                    { name: 'Raysan Petrol Pump', coordinates: { latitude: 23.1500, longitude: 72.6200 }, arrivalTime: '09:42' },
                    { name: 'Sargasan Cross Road', coordinates: { latitude: 23.1200, longitude: 72.6100 }, arrivalTime: '09:54' },
                    { name: 'Vaishnodevi Circle', coordinates: { latitude: 23.0800, longitude: 72.5900 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Gandhinagar Bus Stand', coordinates: { latitude: 23.2156, longitude: 72.6369 }, arrivalTime: '11:40' },
                    { name: 'Sector 1 Circle', coordinates: { latitude: 23.2200, longitude: 72.6400 }, arrivalTime: '11:52' },
                    { name: 'Akshardham Temple', coordinates: { latitude: 23.2495, longitude: 72.6603 }, arrivalTime: '12:04' },
                    { name: 'Sector 11 Market', coordinates: { latitude: 23.2350, longitude: 72.6450 }, arrivalTime: '12:16' },
                    { name: 'Infocity', coordinates: { latitude: 23.2385, longitude: 72.6288 }, arrivalTime: '12:28' },
                    { name: 'Kudasan Circle', coordinates: { latitude: 23.1780, longitude: 72.6389 }, arrivalTime: '12:40' },
                    { name: 'Raysan Petrol Pump', coordinates: { latitude: 23.1500, longitude: 72.6200 }, arrivalTime: '12:52' },
                    { name: 'Sargasan Cross Road', coordinates: { latitude: 23.1200, longitude: 72.6100 }, arrivalTime: '13:04' },
                    { name: 'Vaishnodevi Circle', coordinates: { latitude: 23.0800, longitude: 72.5900 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Gandhinagar Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Mehsana Route',
        routeNumber: 'MSN-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Mehsana ST Bus Stand', coordinates: { latitude: 23.5880, longitude: 72.3693 }, arrivalTime: '08:30' },
                    { name: 'PDPU Chowk', coordinates: { latitude: 23.5700, longitude: 72.3800 }, arrivalTime: '08:42' },
                    { name: 'Modhera Cross Road', coordinates: { latitude: 23.5400, longitude: 72.4000 }, arrivalTime: '08:54' },
                    { name: 'Kadi Circle', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '09:06' },
                    { name: 'Kalol GIDC', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '09:18' },
                    { name: 'Naroda Patiya', coordinates: { latitude: 23.0700, longitude: 72.6400 }, arrivalTime: '09:30' },
                    { name: 'Vastral', coordinates: { latitude: 23.0400, longitude: 72.6200 }, arrivalTime: '09:42' },
                    { name: 'Nikol', coordinates: { latitude: 23.0300, longitude: 72.6000 }, arrivalTime: '09:54' },
                    { name: 'Sabarmati', coordinates: { latitude: 23.0600, longitude: 72.5800 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Mehsana ST Bus Stand', coordinates: { latitude: 23.5880, longitude: 72.3693 }, arrivalTime: '11:40' },
                    { name: 'PDPU Chowk', coordinates: { latitude: 23.5700, longitude: 72.3800 }, arrivalTime: '11:52' },
                    { name: 'Modhera Cross Road', coordinates: { latitude: 23.5400, longitude: 72.4000 }, arrivalTime: '12:04' },
                    { name: 'Kadi Circle', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '12:16' },
                    { name: 'Kalol GIDC', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '12:28' },
                    { name: 'Naroda Patiya', coordinates: { latitude: 23.0700, longitude: 72.6400 }, arrivalTime: '12:40' },
                    { name: 'Vastral', coordinates: { latitude: 23.0400, longitude: 72.6200 }, arrivalTime: '12:52' },
                    { name: 'Nikol', coordinates: { latitude: 23.0300, longitude: 72.6000 }, arrivalTime: '13:04' },
                    { name: 'Sabarmati', coordinates: { latitude: 23.0600, longitude: 72.5800 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Mehsana ST Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Himatnagar Route',
        routeNumber: 'HMT-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Himatnagar Bus Stand', coordinates: { latitude: 23.5984, longitude: 72.9695 }, arrivalTime: '08:30' },
                    { name: 'Shamlaji Circle', coordinates: { latitude: 23.5800, longitude: 72.9500 }, arrivalTime: '08:42' },
                    { name: 'Idar Road', coordinates: { latitude: 23.5600, longitude: 72.9300 }, arrivalTime: '08:54' },
                    { name: 'Bayad Circle', coordinates: { latitude: 23.3200, longitude: 73.0800 }, arrivalTime: '09:06' },
                    { name: 'Dhansura', coordinates: { latitude: 23.0900, longitude: 73.2000 }, arrivalTime: '09:18' },
                    { name: 'Modasa Road', coordinates: { latitude: 23.1500, longitude: 73.1000 }, arrivalTime: '09:30' },
                    { name: 'Malpur', coordinates: { latitude: 23.1000, longitude: 72.8000 }, arrivalTime: '09:42' },
                    { name: 'Vijapur Junction', coordinates: { latitude: 23.5633, longitude: 72.7490 }, arrivalTime: '09:54' },
                    { name: 'Randheja', coordinates: { latitude: 23.4000, longitude: 72.7000 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Himatnagar Bus Stand', coordinates: { latitude: 23.5984, longitude: 72.9695 }, arrivalTime: '11:40' },
                    { name: 'Shamlaji Circle', coordinates: { latitude: 23.5800, longitude: 72.9500 }, arrivalTime: '11:52' },
                    { name: 'Idar Road', coordinates: { latitude: 23.5600, longitude: 72.9300 }, arrivalTime: '12:04' },
                    { name: 'Bayad Circle', coordinates: { latitude: 23.3200, longitude: 73.0800 }, arrivalTime: '12:16' },
                    { name: 'Dhansura', coordinates: { latitude: 23.0900, longitude: 73.2000 }, arrivalTime: '12:28' },
                    { name: 'Modasa Road', coordinates: { latitude: 23.1500, longitude: 73.1000 }, arrivalTime: '12:40' },
                    { name: 'Malpur', coordinates: { latitude: 23.1000, longitude: 72.8000 }, arrivalTime: '12:52' },
                    { name: 'Vijapur Junction', coordinates: { latitude: 23.5633, longitude: 72.7490 }, arrivalTime: '13:04' },
                    { name: 'Randheja', coordinates: { latitude: 23.4000, longitude: 72.7000 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Himatnagar Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Vijapur Route',
        routeNumber: 'VJP-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Vijapur Bus Stand', coordinates: { latitude: 23.5633, longitude: 72.7490 }, arrivalTime: '08:30' },
                    { name: 'Vijapur Market', coordinates: { latitude: 23.5650, longitude: 72.7500 }, arrivalTime: '08:42' },
                    { name: 'Patan Road', coordinates: { latitude: 23.5500, longitude: 72.7400 }, arrivalTime: '08:54' },
                    { name: 'Unava', coordinates: { latitude: 23.5000, longitude: 72.7000 }, arrivalTime: '09:06' },
                    { name: 'Kheralu', coordinates: { latitude: 23.8850, longitude: 72.6200 }, arrivalTime: '09:18' },
                    { name: 'Chanasma Road', coordinates: { latitude: 23.7200, longitude: 72.1100 }, arrivalTime: '09:30' },
                    { name: 'Mahesana Link Road', coordinates: { latitude: 23.4500, longitude: 72.5000 }, arrivalTime: '09:42' },
                    { name: 'Kadi Bypass', coordinates: { latitude: 23.3100, longitude: 72.3400 }, arrivalTime: '09:54' },
                    { name: 'Kalol Circle', coordinates: { latitude: 23.2500, longitude: 72.5000 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Vijapur Bus Stand', coordinates: { latitude: 23.5633, longitude: 72.7490 }, arrivalTime: '11:40' },
                    { name: 'Vijapur Market', coordinates: { latitude: 23.5650, longitude: 72.7500 }, arrivalTime: '11:52' },
                    { name: 'Patan Road', coordinates: { latitude: 23.5500, longitude: 72.7400 }, arrivalTime: '12:04' },
                    { name: 'Unava', coordinates: { latitude: 23.5000, longitude: 72.7000 }, arrivalTime: '12:16' },
                    { name: 'Kheralu', coordinates: { latitude: 23.8850, longitude: 72.6200 }, arrivalTime: '12:28' },
                    { name: 'Chanasma Road', coordinates: { latitude: 23.7200, longitude: 72.1100 }, arrivalTime: '12:40' },
                    { name: 'Mahesana Link Road', coordinates: { latitude: 23.4500, longitude: 72.5000 }, arrivalTime: '12:52' },
                    { name: 'Kadi Bypass', coordinates: { latitude: 23.3100, longitude: 72.3400 }, arrivalTime: '13:04' },
                    { name: 'Kalol Circle', coordinates: { latitude: 23.2500, longitude: 72.5000 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Vijapur Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Patan Route',
        routeNumber: 'PTN-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Patan Bus Stand', coordinates: { latitude: 23.8515, longitude: 72.1218 }, arrivalTime: '08:30' },
                    { name: 'Rani Ki Vav', coordinates: { latitude: 23.8590, longitude: 72.1030 }, arrivalTime: '08:42' },
                    { name: 'Patan Railway Station', coordinates: { latitude: 23.8400, longitude: 72.1300 }, arrivalTime: '08:54' },
                    { name: 'Saraswati River Bridge', coordinates: { latitude: 23.8300, longitude: 72.1400 }, arrivalTime: '09:06' },
                    { name: 'Radhanpur Road', coordinates: { latitude: 23.8200, longitude: 72.0900 }, arrivalTime: '09:18' },
                    { name: 'Sidhpur Junction', coordinates: { latitude: 23.9158, longitude: 72.3716 }, arrivalTime: '09:30' },
                    { name: 'Unjha Circle', coordinates: { latitude: 23.8038, longitude: 72.3916 }, arrivalTime: '09:42' },
                    { name: 'Mehsana Highway', coordinates: { latitude: 23.7000, longitude: 72.3500 }, arrivalTime: '09:54' },
                    { name: 'Kadi Junction', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Patan Bus Stand', coordinates: { latitude: 23.8515, longitude: 72.1218 }, arrivalTime: '11:40' },
                    { name: 'Rani Ki Vav', coordinates: { latitude: 23.8590, longitude: 72.1030 }, arrivalTime: '11:52' },
                    { name: 'Patan Railway Station', coordinates: { latitude: 23.8400, longitude: 72.1300 }, arrivalTime: '12:04' },
                    { name: 'Saraswati River Bridge', coordinates: { latitude: 23.8300, longitude: 72.1400 }, arrivalTime: '12:16' },
                    { name: 'Radhanpur Road', coordinates: { latitude: 23.8200, longitude: 72.0900 }, arrivalTime: '12:28' },
                    { name: 'Sidhpur Junction', coordinates: { latitude: 23.9158, longitude: 72.3716 }, arrivalTime: '12:40' },
                    { name: 'Unjha Circle', coordinates: { latitude: 23.8038, longitude: 72.3916 }, arrivalTime: '12:52' },
                    { name: 'Mehsana Highway', coordinates: { latitude: 23.7000, longitude: 72.3500 }, arrivalTime: '13:04' },
                    { name: 'Kadi Junction', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Patan Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Unjha Route',
        routeNumber: 'UNJ-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Unjha Bus Stand', coordinates: { latitude: 23.8038, longitude: 72.3916 }, arrivalTime: '08:30' },
                    { name: 'Unjha Market Yard', coordinates: { latitude: 23.8050, longitude: 72.3950 }, arrivalTime: '08:42' },
                    { name: 'Umiya Mata Mandir', coordinates: { latitude: 23.8100, longitude: 72.4000 }, arrivalTime: '08:54' },
                    { name: 'Sidhpur Road', coordinates: { latitude: 23.8200, longitude: 72.3800 }, arrivalTime: '09:06' },
                    { name: 'Visnagar Junction', coordinates: { latitude: 23.6983, longitude: 72.5569 }, arrivalTime: '09:18' },
                    { name: 'Kheralu Circle', coordinates: { latitude: 23.8850, longitude: 72.6200 }, arrivalTime: '09:30' },
                    { name: 'Mehsana Link Road', coordinates: { latitude: 23.7000, longitude: 72.4500 }, arrivalTime: '09:42' },
                    { name: 'Kalol GIDC', coordinates: { latitude: 23.2500, longitude: 72.5000 }, arrivalTime: '09:54' },
                    { name: 'Gandhinagar Link', coordinates: { latitude: 23.1500, longitude: 72.6000 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Unjha Bus Stand', coordinates: { latitude: 23.8038, longitude: 72.3916 }, arrivalTime: '11:40' },
                    { name: 'Unjha Market Yard', coordinates: { latitude: 23.8050, longitude: 72.3950 }, arrivalTime: '11:52' },
                    { name: 'Umiya Mata Mandir', coordinates: { latitude: 23.8100, longitude: 72.4000 }, arrivalTime: '12:04' },
                    { name: 'Sidhpur Road', coordinates: { latitude: 23.8200, longitude: 72.3800 }, arrivalTime: '12:16' },
                    { name: 'Visnagar Junction', coordinates: { latitude: 23.6983, longitude: 72.5569 }, arrivalTime: '12:28' },
                    { name: 'Kheralu Circle', coordinates: { latitude: 23.8850, longitude: 72.6200 }, arrivalTime: '12:40' },
                    { name: 'Mehsana Link Road', coordinates: { latitude: 23.7000, longitude: 72.4500 }, arrivalTime: '12:52' },
                    { name: 'Kalol GIDC', coordinates: { latitude: 23.2500, longitude: 72.5000 }, arrivalTime: '13:04' },
                    { name: 'Gandhinagar Link', coordinates: { latitude: 23.1500, longitude: 72.6000 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Unjha Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Sidhpur Route',
        routeNumber: 'SDP-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Sidhpur Bus Stand', coordinates: { latitude: 23.9158, longitude: 72.3716 }, arrivalTime: '08:30' },
                    { name: 'Bindu Sarovar', coordinates: { latitude: 23.9170, longitude: 72.3750 }, arrivalTime: '08:42' },
                    { name: 'Sidhpur Railway Station', coordinates: { latitude: 23.9100, longitude: 72.3700 }, arrivalTime: '08:54' },
                    { name: 'Patan Highway', coordinates: { latitude: 23.9000, longitude: 72.2500 }, arrivalTime: '09:06' },
                    { name: 'Unjha Junction', coordinates: { latitude: 23.8038, longitude: 72.3916 }, arrivalTime: '09:18' },
                    { name: 'Visnagar', coordinates: { latitude: 23.6983, longitude: 72.5569 }, arrivalTime: '09:30' },
                    { name: 'Mehsana Bypass', coordinates: { latitude: 23.5900, longitude: 72.3700 }, arrivalTime: '09:42' },
                    { name: 'Kadi Town', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '09:54' },
                    { name: 'Kalol Junction', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Sidhpur Bus Stand', coordinates: { latitude: 23.9158, longitude: 72.3716 }, arrivalTime: '11:40' },
                    { name: 'Bindu Sarovar', coordinates: { latitude: 23.9170, longitude: 72.3750 }, arrivalTime: '11:52' },
                    { name: 'Sidhpur Railway Station', coordinates: { latitude: 23.9100, longitude: 72.3700 }, arrivalTime: '12:04' },
                    { name: 'Patan Highway', coordinates: { latitude: 23.9000, longitude: 72.2500 }, arrivalTime: '12:16' },
                    { name: 'Unjha Junction', coordinates: { latitude: 23.8038, longitude: 72.3916 }, arrivalTime: '12:28' },
                    { name: 'Visnagar', coordinates: { latitude: 23.6983, longitude: 72.5569 }, arrivalTime: '12:40' },
                    { name: 'Mehsana Bypass', coordinates: { latitude: 23.5900, longitude: 72.3700 }, arrivalTime: '12:52' },
                    { name: 'Kadi Town', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '13:04' },
                    { name: 'Kalol Junction', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Sidhpur Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Palanpur Route',
        routeNumber: 'PLN-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Palanpur Bus Stand', coordinates: { latitude: 24.1717, longitude: 72.4386 }, arrivalTime: '08:30' },
                    { name: 'Palanpur Railway Station', coordinates: { latitude: 24.1750, longitude: 72.4400 }, arrivalTime: '08:42' },
                    { name: 'Balaram Palace', coordinates: { latitude: 24.3886, longitude: 72.8664 }, arrivalTime: '08:54' },
                    { name: 'Dantiwada Road', coordinates: { latitude: 24.1500, longitude: 72.7700 }, arrivalTime: '09:06' },
                    { name: 'Deesa Junction', coordinates: { latitude: 24.2600, longitude: 72.1900 }, arrivalTime: '09:18' },
                    { name: 'Radhanpur', coordinates: { latitude: 23.8300, longitude: 71.6050 }, arrivalTime: '09:30' },
                    { name: 'Patan Cross', coordinates: { latitude: 23.8515, longitude: 72.1218 }, arrivalTime: '09:42' },
                    { name: 'Unjha Highway', coordinates: { latitude: 23.8000, longitude: 72.3900 }, arrivalTime: '09:54' },
                    { name: 'Mehsana Link', coordinates: { latitude: 23.5880, longitude: 72.3693 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Palanpur Bus Stand', coordinates: { latitude: 24.1717, longitude: 72.4386 }, arrivalTime: '11:40' },
                    { name: 'Palanpur Railway Station', coordinates: { latitude: 24.1750, longitude: 72.4400 }, arrivalTime: '11:52' },
                    { name: 'Balaram Palace', coordinates: { latitude: 24.3886, longitude: 72.8664 }, arrivalTime: '12:04' },
                    { name: 'Dantiwada Road', coordinates: { latitude: 24.1500, longitude: 72.7700 }, arrivalTime: '12:16' },
                    { name: 'Deesa Junction', coordinates: { latitude: 24.2600, longitude: 72.1900 }, arrivalTime: '12:28' },
                    { name: 'Radhanpur', coordinates: { latitude: 23.8300, longitude: 71.6050 }, arrivalTime: '12:40' },
                    { name: 'Patan Cross', coordinates: { latitude: 23.8515, longitude: 72.1218 }, arrivalTime: '12:52' },
                    { name: 'Unjha Highway', coordinates: { latitude: 23.8000, longitude: 72.3900 }, arrivalTime: '13:04' },
                    { name: 'Mehsana Link', coordinates: { latitude: 23.5880, longitude: 72.3693 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Palanpur Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Idar Route',
        routeNumber: 'IDR-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Idar Bus Stand', coordinates: { latitude: 23.8394, longitude: 73.0093 }, arrivalTime: '08:30' },
                    { name: 'Idar Fort Area', coordinates: { latitude: 23.8400, longitude: 73.0100 }, arrivalTime: '08:42' },
                    { name: 'Vishwamitri River Bridge', coordinates: { latitude: 23.8300, longitude: 73.0000 }, arrivalTime: '08:54' },
                    { name: 'Himmatnagar Road', coordinates: { latitude: 23.7500, longitude: 72.9500 }, arrivalTime: '09:06' },
                    { name: 'Shamlaji Junction', coordinates: { latitude: 23.5800, longitude: 72.9500 }, arrivalTime: '09:18' },
                    { name: 'Modasa Link', coordinates: { latitude: 23.4622, longitude: 73.2997 }, arrivalTime: '09:30' },
                    { name: 'Bayad Circle', coordinates: { latitude: 23.3200, longitude: 73.0800 }, arrivalTime: '09:42' },
                    { name: 'Vijapur Highway', coordinates: { latitude: 23.5633, longitude: 72.7490 }, arrivalTime: '09:54' },
                    { name: 'Mehsana Junction', coordinates: { latitude: 23.5880, longitude: 72.3693 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Idar Bus Stand', coordinates: { latitude: 23.8394, longitude: 73.0093 }, arrivalTime: '11:40' },
                    { name: 'Idar Fort Area', coordinates: { latitude: 23.8400, longitude: 73.0100 }, arrivalTime: '11:52' },
                    { name: 'Vishwamitri River Bridge', coordinates: { latitude: 23.8300, longitude: 73.0000 }, arrivalTime: '12:04' },
                    { name: 'Himmatnagar Road', coordinates: { latitude: 23.7500, longitude: 72.9500 }, arrivalTime: '12:16' },
                    { name: 'Shamlaji Junction', coordinates: { latitude: 23.5800, longitude: 72.9500 }, arrivalTime: '12:28' },
                    { name: 'Modasa Link', coordinates: { latitude: 23.4622, longitude: 73.2997 }, arrivalTime: '12:40' },
                    { name: 'Bayad Circle', coordinates: { latitude: 23.3200, longitude: 73.0800 }, arrivalTime: '12:52' },
                    { name: 'Vijapur Highway', coordinates: { latitude: 23.5633, longitude: 72.7490 }, arrivalTime: '13:04' },
                    { name: 'Mehsana Junction', coordinates: { latitude: 23.5880, longitude: 72.3693 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Idar Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Kadi Route',
        routeNumber: 'KDI-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Kadi Bus Stand', coordinates: { latitude: 23.2993, longitude: 72.3331 }, arrivalTime: '08:30' },
                    { name: 'Kadi Railway Station', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '08:42' },
                    { name: 'Kadi Market', coordinates: { latitude: 23.3050, longitude: 72.3350 }, arrivalTime: '08:54' },
                    { name: 'GIDC Kadi', coordinates: { latitude: 23.3100, longitude: 72.3400 }, arrivalTime: '09:06' },
                    { name: 'Mehsana Link Road', coordinates: { latitude: 23.4000, longitude: 72.3500 }, arrivalTime: '09:18' },
                    { name: 'Kalol Junction', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '09:30' },
                    { name: 'Chiloda Cross', coordinates: { latitude: 23.2000, longitude: 72.5500 }, arrivalTime: '09:42' },
                    { name: 'Randheja Town', coordinates: { latitude: 23.1500, longitude: 72.6000 }, arrivalTime: '09:54' },
                    { name: 'Sabarmati Junction', coordinates: { latitude: 23.0600, longitude: 72.5800 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Kadi Bus Stand', coordinates: { latitude: 23.2993, longitude: 72.3331 }, arrivalTime: '11:40' },
                    { name: 'Kadi Railway Station', coordinates: { latitude: 23.3000, longitude: 72.3300 }, arrivalTime: '11:52' },
                    { name: 'Kadi Market', coordinates: { latitude: 23.3050, longitude: 72.3350 }, arrivalTime: '12:04' },
                    { name: 'GIDC Kadi', coordinates: { latitude: 23.3100, longitude: 72.3400 }, arrivalTime: '12:16' },
                    { name: 'Mehsana Link Road', coordinates: { latitude: 23.4000, longitude: 72.3500 }, arrivalTime: '12:28' },
                    { name: 'Kalol Junction', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '12:40' },
                    { name: 'Chiloda Cross', coordinates: { latitude: 23.2000, longitude: 72.5500 }, arrivalTime: '12:52' },
                    { name: 'Randheja Town', coordinates: { latitude: 23.1500, longitude: 72.6000 }, arrivalTime: '13:04' },
                    { name: 'Sabarmati Junction', coordinates: { latitude: 23.0600, longitude: 72.5800 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Kadi Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    },
    {
        routeName: 'Kalol Route',
        routeNumber: 'KLL-01',
        shifts: [
            {
                shiftType: 'morning',
                stops: [
                    { name: 'Kalol Bus Stand', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '08:30' },
                    { name: 'Kalol GIDC', coordinates: { latitude: 23.2500, longitude: 72.5000 }, arrivalTime: '08:42' },
                    { name: 'Kalol Railway Station', coordinates: { latitude: 23.2450, longitude: 72.4900 }, arrivalTime: '08:54' },
                    { name: 'Kalol Market', coordinates: { latitude: 23.2480, longitude: 72.4980 }, arrivalTime: '09:06' },
                    { name: 'Kadi Link Road', coordinates: { latitude: 23.2700, longitude: 72.4000 }, arrivalTime: '09:18' },
                    { name: 'Chiloda', coordinates: { latitude: 23.2000, longitude: 72.5500 }, arrivalTime: '09:30' },
                    { name: 'Randheja', coordinates: { latitude: 23.1500, longitude: 72.6000 }, arrivalTime: '09:42' },
                    { name: 'Gandhinagar Link', coordinates: { latitude: 23.1000, longitude: 72.6200 }, arrivalTime: '09:54' },
                    { name: 'Sabarmati', coordinates: { latitude: 23.0600, longitude: 72.5800 }, arrivalTime: '10:06' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '10:18' }
                ]
            },
            {
                shiftType: 'afternoon',
                stops: [
                    { name: 'Kalol Bus Stand', coordinates: { latitude: 23.2460, longitude: 72.4950 }, arrivalTime: '11:40' },
                    { name: 'Kalol GIDC', coordinates: { latitude: 23.2500, longitude: 72.5000 }, arrivalTime: '11:52' },
                    { name: 'Kalol Railway Station', coordinates: { latitude: 23.2450, longitude: 72.4900 }, arrivalTime: '12:04' },
                    { name: 'Kalol Market', coordinates: { latitude: 23.2480, longitude: 72.4980 }, arrivalTime: '12:16' },
                    { name: 'Kadi Link Road', coordinates: { latitude: 23.2700, longitude: 72.4000 }, arrivalTime: '12:28' },
                    { name: 'Chiloda', coordinates: { latitude: 23.2000, longitude: 72.5500 }, arrivalTime: '12:40' },
                    { name: 'Randheja', coordinates: { latitude: 23.1500, longitude: 72.6000 }, arrivalTime: '12:52' },
                    { name: 'Gandhinagar Link', coordinates: { latitude: 23.1000, longitude: 72.6200 }, arrivalTime: '13:04' },
                    { name: 'Sabarmati', coordinates: { latitude: 23.0600, longitude: 72.5800 }, arrivalTime: '13:16' },
                    { name: 'GUNI Campus', coordinates: { latitude: 23.0225, longitude: 72.5714 }, arrivalTime: '13:28' }
                ]
            }
        ],
        startPoint: 'Kalol Bus Stand',
        endPoint: 'GUNI Campus',
        isActive: true
    }
];

const seedRoutes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        console.log('🗺️  Creating Gujarat bus routes...\n');

        for (const routeData of routes) {
            const existing = await Route.findOne({ routeNumber: routeData.routeNumber });

            if (existing) {
                console.log(`⏭️  ${routeData.routeName} (${routeData.routeNumber}) already exists`);
            } else {
                await Route.create(routeData);
                console.log(`✅ Created ${routeData.routeName} (${routeData.routeNumber})`);
                console.log(`   Start: ${routeData.startPoint} → End: ${routeData.endPoint}`);
                console.log(`   Stops: ${routeData.shifts[0].stops.length} per shift\n`);
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 All routes seeded successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📊 Summary:`);
        console.log(`   Total Routes: ${routes.length}`);
        console.log(`   Shift Timings:`);
        console.log(`     Morning: 08:30 - 14:10`);
        console.log(`     Afternoon: 11:40 - 17:20`);
        console.log(`   Stops per route: 10\n`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

seedRoutes();
