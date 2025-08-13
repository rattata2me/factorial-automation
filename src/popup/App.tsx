import React, { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from '@apollo/client';
import { Settings, STORAGE_KEY, DEFAULT_UTC_OFFSET } from './types';
import icon from '../../icons/icon32.png';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ShiftForm } from './components/ShiftForm';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

const getInitialSettings = (): Settings | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

const saveSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const createApolloClient = (cookies: string) => {
  const link = createHttpLink({
    uri: 'https://api.factorialhr.com/graphql',
    headers: {
      cookie: cookies
    }
  });

  return new ApolloClient({
    link,
    cache: new InMemoryCache()
  });
};

const SettingsForm: React.FC<{
  onSave: (settings: Settings) => void;
  onCancel: () => void;
  initialSettings?: Settings;
}> = ({ onSave, onCancel, initialSettings }) => {
  const [employeeId, setEmployeeId] = useState(initialSettings?.employeeId || '');
  const [cookies, setCookies] = useState(initialSettings?.cookies || '');
  const [utcOffset, setUtcOffset] = useState(initialSettings?.utcOffset || DEFAULT_UTC_OFFSET);

  const saveFormData = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ employeeId, cookies, utcOffset });
  };

  return (
    <form onSubmit={saveFormData} className="settings-form">
      <div className="form-group">
        <label htmlFor="employeeId">Employee ID:</label>
        <input
          id="employeeId"
          type="text"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="cookies">Chrome Cookies:</label>
        <textarea
          id="cookies"
          value={cookies}
          onChange={(e) => setCookies(e.target.value)}
          placeholder="Paste your cookies here..."
          required
        />
      </div>
    <div className="form-group">
      <label htmlFor="utcOffset">UTC Offset:</label>
      <select
        id="utcOffset"
        value={utcOffset}
        onChange={(e) => setUtcOffset(e.target.value)}
        required
      >
        <option value="-12:00">UTC-12:00</option>
        <option value="-11:00">UTC-11:00</option>
        <option value="-10:00">UTC-10:00</option>
        <option value="-09:00">UTC-09:00</option>
        <option value="-08:00">UTC-08:00</option>
        <option value="-07:00">UTC-07:00</option>
        <option value="-06:00">UTC-06:00</option>
        <option value="-05:00">UTC-05:00</option>
        <option value="-04:00">UTC-04:00</option>
        <option value="-03:00">UTC-03:00</option>
        <option value="-02:00">UTC-02:00</option>
        <option value="-01:00">UTC-01:00</option>
        <option value="+00:00">UTC+00:00</option>
        <option value="+01:00">UTC+01:00</option>
        <option value="+02:00">UTC+02:00</option>
        <option value="+03:00">UTC+03:00</option>
        <option value="+04:00">UTC+04:00</option>
        <option value="+05:00">UTC+05:00</option>
        <option value="+06:00">UTC+06:00</option>
        <option value="+07:00">UTC+07:00</option>
        <option value="+08:00">UTC+08:00</option>
        <option value="+09:00">UTC+09:00</option>
        <option value="+10:00">UTC+10:00</option>
        <option value="+11:00">UTC+11:00</option>
        <option value="+12:00">UTC+12:00</option>
        <option value="+13:00">UTC+13:00</option>
        <option value="+14:00">UTC+14:00</option>
      </select>
    </div>
    <div className="form-buttons">
      <button type="button" onClick={onCancel} className="secondary-button">Cancel</button>
      <button type="submit" className="primary-button">Save Settings</button>
    </div>
    </form>
  );
};

const AppContent: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(getInitialSettings);
  const [showSettings, setShowSettings] = useState(!settings);
  const [showShiftCompletion, setShowShiftCompletion] = useState(false);
  const [client, setClient] = useState<ApolloClient<any> | null>(null);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (settings?.cookies) {
      setClient(createApolloClient(settings.cookies));
    }
  }, [settings]);

  const handleSaveSettings = (newSettings: Settings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    setShowSettings(false);
  };

  return (
    <div className="app" data-theme={isDark ? "dark" : "light"}>
      <header>
        <div className="header-title">
          <img src={icon} alt="Factorial Automation" className="header-icon" />
          <h1>Factorial Automation</h1>
        </div>
        <div className="header-buttons">
          <button 
            className="icon-button"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? "🌞" : "🌙"}
          </button>
          <button 
            className="icon-button"
            onClick={() => setShowSettings(!showSettings)}
            title={showSettings ? "Back to Main" : "Settings"}
          >
            ⚙️
          </button>
        </div>
      </header>
      
      {showSettings ? (
        <SettingsForm 
          onSave={handleSaveSettings} 
          onCancel={() => setShowSettings(false)}
          initialSettings={settings || undefined} />
      ) : client ? (
        <ApolloProvider client={client}>
          <div className="main-content">
            <button 
              className="primary-button"
              onClick={() => setShowShiftCompletion(true)}
            >
              Complete Shifts
            </button>
            
            {showShiftCompletion && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <ShiftForm
                    onClose={() => setShowShiftCompletion(false)}
                    onSubmit={(data) => {
                      console.log('Shift completion data:', data);
                      // TODO: Implement shift completion logic
                      setShowShiftCompletion(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </ApolloProvider>
      ) : null}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
