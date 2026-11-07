# 🔗 [mProtocol](https://majestorg.github.io/mProtocol/)
> [!WARNING]
> Из России сервис сейчас работает только через VPN: сигнальный сервер на Render.com вероятно заблокирован по IP.

---

<table>

  <tr>
    <td width="50%" valign="top">
      <h2>⚡ О проекте</h2>
      <p><b>mProtocol</b> — это приватный веб-мессенджер, построенный на технологии WebRTC.</p>
      <p align="left">
        <img src="https://img.shields.io/badge/Версия-2.5-success" alt="Status"> 
      </p>
    </td>
    <td width="50%" rowspan="2" align="center" valign="middle">
      <img 
        src="https://github.com/user-attachments/assets/1366e2d7-e2a5-4c88-82ab-815d882ffc0c"
        alt="mProtocol UI"
        style="max-width: 100%; height: auto; width: 500px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
    </td>
  </tr>
  <tr>
    <td valign="top">
      <h2>🛠 Технический стек "M-Link"</h2>
      <table width="100%">
        <tr><td><b>Protocol</b></td><td><code>WebRTC</code></td></tr>
        <tr><td><b>Signaling</b></td><td><code>Render.com</code></td></tr>
        <tr><td><b>STUN</b></td><td><code>OpenRelay STUN</code></td></tr>
        <tr><td><b>TURN</b></td><td><code>Metered TURN</code></td></tr>
      </table>
    </td>
  </tr>
</table>

---

## 🧠 Логика работы

> [!NOTE]
>* **Zero-Server Storage**: Сообщения передаются напрямую между браузерами. Данные не сохраняются на сервере и не записываются в базу данных.

* **P2P Канал связи**: Прямой канал передачи данных между браузерами.
* **Signal Isolation**: Сигнальный сокет автоматически отключается после установки P2P-моста.
* **Мониторинг задержки**: Встроенный счетчик задержки соединения в реальном времени.
* **Безопасность сессии**: Доступ по временному **6-значному коду**, который генерируется "на лету".

---

## 📂 Развертывание

- [x] **Простой запуск**: Хостинг фронтенда на GitHub Pages.
- [x] **Шифрование**: Весь трафик зашифрован стеком WebRTC (DTLS/SRTP).
- [x] **Быстрый доступ**: 🚀 **[Открыть mProtocol](https://majestorg.github.io/mProtocol/)**

---

<br/>

<p align="center">
  <sub>© 2026 <b>Engineered by Matvey</b></sub>
</p>
