import { Eyebrow } from '../components/Eyebrow'
import screen from './Screen.module.css'

// Settings holds its place in the navigation until there are settings; for now it carries the credits.
export function Settings() {
  return (
    <div className={screen.screen}>
      <div className={screen.title}>
        <Eyebrow gold>Settings</Eyebrow>
        <h1>Settings</h1>
      </div>
      <h2 className={screen.heading}>Credits</h2>
      <p className={screen.note}>
        Card art by Pamela Colman Smith for the 1909 Rider-Waite tarot, from the original “Roses &amp; Lilies” printing,
        scanned by Saskia Jansen. Public domain, via{' '}
        <a href="https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)">Wikimedia Commons</a>.
      </p>
    </div>
  )
}
