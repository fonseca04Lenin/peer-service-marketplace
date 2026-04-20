import time
import random
import string
import unittest

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
#change if necessary
BASE_URL = "http://localhost:5173"


def rand_str(n=6):
    return ''.join(random.choices(string.ascii_lowercase, k=n))


def make_user():
    u = rand_str()
    return {
        "first": "Test",
        "last": "User",
        "username": f"testuser_{u}",
        "email": f"testuser_{u}@example.com",
        "password": "TestPass123!",
        "country": "United States",
        "city": "Austin",
    }


class MarketplaceTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        options = webdriver.ChromeOptions()
        # options.add_argument("--headless")
        cls.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options,
        )
        cls.driver.implicitly_wait(6)
        cls.wait = WebDriverWait(cls.driver, 10)
        cls.shared_user = make_user()
        cls._register_shared_user()

    @classmethod
    def _register_shared_user(cls):
        d = cls.driver
        d.get(BASE_URL)
        time.sleep(1)
        d.find_element(By.XPATH, "//button[contains(text(), 'Get started')]").click()
        time.sleep(0.5)

        u = cls.shared_user
        d.find_element(By.XPATH, "//input[@placeholder='Optimus']").send_keys(u["first"])
        d.find_element(By.XPATH, "//input[@placeholder='Prime']").send_keys(u["last"])
        d.find_element(By.XPATH, "//input[@placeholder='your_username']").send_keys(u["username"])
        d.find_element(By.XPATH, "//input[@placeholder='you@example.com']").send_keys(u["email"])
        d.find_element(By.XPATH, "//input[@placeholder='••••••••']").send_keys(u["password"])

        select = Select(d.find_element(By.XPATH, "//select"))
        select.select_by_visible_text(u["country"])
        time.sleep(0.4)

        city_input = d.find_element(By.XPATH, "//input[@placeholder='e.g. Austin']")
        city_input.send_keys(u["city"])
        time.sleep(0.3)

        d.find_element(By.XPATH, "//button[contains(text(), 'Create account')]").click()
        time.sleep(1.5)

        nav_divs = d.find_elements(By.XPATH, "//header//div[@style]")
        nav_divs[-1].click()
        time.sleep(0.4)
        d.find_element(By.XPATH, "//button[contains(text(), 'Sign out')]").click()
        time.sleep(1)

    def _logout(self):
        d = self.driver
        try:
            d.find_element(By.XPATH, "//*[contains(@style, 'userTrigger') or contains(@class, 'userTrigger')]").click()
        except NoSuchElementException:
            d.find_elements(By.XPATH, "//header//div")[-2].click()
        time.sleep(0.4)
        d.find_element(By.XPATH, "//button[contains(text(), 'Sign out')]").click()
        time.sleep(1)

    def _login(self, username, password):
        d = self.driver
        d.get(BASE_URL)
        time.sleep(0.8)
        d.find_element(By.XPATH, "//button[contains(text(), 'Sign in')]").click()
        time.sleep(0.5)
        d.find_element(By.XPATH, "//input[@placeholder='your_username']").send_keys(username)
        d.find_element(By.XPATH, "//input[@placeholder='••••••••']").send_keys(password)
        d.find_element(By.XPATH, "//button[contains(text(), 'Sign in')]").click()
        time.sleep(1.5)

    def test_01_landing_page_loads(self):
        d = self.driver
        d.get(BASE_URL)
        time.sleep(1)

        self.assertIn("localhost", d.current_url)
        body = d.find_element(By.TAG_NAME, "body").text
        self.assertIn("Sign in", body)
        self.assertIn("Get started", body)

    def test_02_register_new_user(self):
        d = self.driver
        d.get(BASE_URL)
        time.sleep(0.8)

        d.find_element(By.XPATH, "//button[contains(text(), 'Get started')]").click()
        time.sleep(0.5)

        u = make_user()
        d.find_element(By.XPATH, "//input[@placeholder='Optimus']").send_keys(u["first"])
        d.find_element(By.XPATH, "//input[@placeholder='Prime']").send_keys(u["last"])
        d.find_element(By.XPATH, "//input[@placeholder='your_username']").send_keys(u["username"])
        d.find_element(By.XPATH, "//input[@placeholder='you@example.com']").send_keys(u["email"])
        d.find_element(By.XPATH, "//input[@placeholder='••••••••']").send_keys(u["password"])

        select = Select(d.find_element(By.XPATH, "//select"))
        select.select_by_visible_text("United States")
        time.sleep(0.4)

        city_input = d.find_element(By.XPATH, "//input[@placeholder='e.g. Austin']")
        city_input.send_keys("Austin")
        time.sleep(0.3)

        d.find_element(By.XPATH, "//button[contains(text(), 'Create account')]").click()
        time.sleep(1.5)

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            "Dashboard" in body or "Explore" in body or "Bookings" in body,
            "Expected to land on main page after registration"
        )
        self._logout()

    def test_03_user_can_login(self):
        d = self.driver
        u = self.shared_user
        self._login(u["username"], u["password"])

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            "Dashboard" in body or "Explore" in body,
            "Expected to be logged in and see main nav"
        )

    def test_04_navigation_tabs_work(self):
        d = self.driver
        body = d.find_element(By.TAG_NAME, "body").text
        if "Sign in" in body or "Get started" in body:
            u = self.shared_user
            self._login(u["username"], u["password"])

        d.find_element(By.XPATH, "//button[contains(text(), 'Explore')]").click()
        time.sleep(0.8)
        self.assertIn("Search Services", d.find_element(By.TAG_NAME, "body").text)

        d.find_element(By.XPATH, "//button[contains(text(), 'Bookings')]").click()
        time.sleep(0.8)
        self.assertIn("Bookings", d.find_element(By.TAG_NAME, "body").text)

        d.find_element(By.XPATH, "//button[contains(text(), 'Dashboard')]").click()
        time.sleep(0.8)
        self.assertIn("Dashboard", d.find_element(By.TAG_NAME, "body").text)

    def test_05_search_filters_by_keyword(self):
        d = self.driver
        body = d.find_element(By.TAG_NAME, "body").text
        if "Sign in" in body or "Get started" in body:
            self._login(self.shared_user["username"], self.shared_user["password"])

        d.find_element(By.XPATH, "//button[contains(text(), 'Explore')]").click()
        time.sleep(1)

        search_input = d.find_element(By.XPATH, "//input[@placeholder='Search services...']")
        search_input.clear()
        search_input.send_keys("tutoring")
        time.sleep(1.5)

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            "tutor" in body.lower() or "No services" in body or "nothing" in body.lower() or "0 result" in body.lower(),
            "Search should return results or an empty state"
        )

    def test_06_messages_page_loads(self):
        d = self.driver
        body = d.find_element(By.TAG_NAME, "body").text
        if "Sign in" in body or "Get started" in body:
            self._login(self.shared_user["username"], self.shared_user["password"])

        d.find_element(By.XPATH, "//button[contains(text(), 'Messages')]").click()
        time.sleep(1)

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertIn("Messages", body)

    def test_07_wallet_page_loads(self):
        d = self.driver
        body = d.find_element(By.TAG_NAME, "body").text
        if "Sign in" in body or "Get started" in body:
            self._login(self.shared_user["username"], self.shared_user["password"])

        try:
            trigger = d.find_element(By.XPATH, "//header//*[contains(text(), 'T') or contains(@style,'userTrigger')]")
            trigger.click()
        except Exception:
            nav_divs = d.find_elements(By.XPATH, "//header//div[@style]")
            nav_divs[-1].click()
        time.sleep(0.4)

        d.find_element(By.XPATH, "//button[contains(text(), 'Wallet')]").click()
        time.sleep(1)

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertIn("Wallet", body)
        self.assertIn("balance", body.lower())

    def test_08_deposit_funds(self):
        d = self.driver
        body = d.find_element(By.TAG_NAME, "body").text
        if "Wallet" not in body or "balance" not in body.lower():
            try:
                nav_divs = d.find_elements(By.XPATH, "//header//div[@style]")
                nav_divs[-1].click()
                time.sleep(0.3)
                d.find_element(By.XPATH, "//button[contains(text(), 'Wallet')]").click()
                time.sleep(1)
            except Exception:
                pass

        amount_input = d.find_element(By.XPATH, "//input[@placeholder='0.00']")
        amount_input.clear()
        amount_input.send_keys("25")
        time.sleep(0.3)

        d.find_element(By.XPATH, "//button[contains(text(), 'Add funds')]").click()
        time.sleep(2)

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            "Funds added" in body or "Added funds" in body or "25.00" in body,
            "Expected deposit confirmation or updated balance"
        )

    def test_09_bookings_page_loads(self):
        d = self.driver
        body = d.find_element(By.TAG_NAME, "body").text
        if "Sign in" in body or "Get started" in body:
            self._login(self.shared_user["username"], self.shared_user["password"])

        d.find_element(By.XPATH, "//button[contains(text(), 'Bookings')]").click()
        time.sleep(1)

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertIn("Bookings", body)

    def test_10_user_can_sign_out(self):
        d = self.driver
        body = d.find_element(By.TAG_NAME, "body").text
        if "Sign in" in body or "Get started" in body:
            self._login(self.shared_user["username"], self.shared_user["password"])
            time.sleep(1)

        try:
            trigger = d.find_elements(By.XPATH, "//header//div[@style]")[-1]
            trigger.click()
        except Exception:
            d.find_elements(By.XPATH, "//header//div")[-2].click()

        time.sleep(0.5)
        d.find_element(By.XPATH, "//button[contains(text(), 'Sign out')]").click()
        time.sleep(1.5)

        body = d.find_element(By.TAG_NAME, "body").text
        self.assertTrue(
            "Sign in" in body or "Get started" in body,
            "After sign out, user should be back on the landing page"
        )

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()


if __name__ == "__main__":
    unittest.main(verbosity=2)
