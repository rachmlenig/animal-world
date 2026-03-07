import THEMES from './data/themes';
import CongaMode from './modes/CongaMode';
import './App.css';

const theme = THEMES.farm;

export default function App() {
  return <CongaMode theme={theme} />;
}
