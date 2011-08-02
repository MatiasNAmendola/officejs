from UNGTestMixin import UNGTestMixin
import unittest


class TestUNGDocsSharing(UNGTestMixin):
    """tests related to the action of share documents on UNG Docs"""

    def test_share_web_page_with_another_user(self):
        """test that web_page is correctly shared with another user"""
        self.selenium.open("ERP5Site_createNewWebDocument?template=web_page_template")
        self.selenium.wait_for_page_to_load("30000")
        self.rename_document(name='Document Shared',
                              version='002',
                              language='pt-br',
                              keywords="My Subject")
        self.selenium.click("//a[@name=\"document_title\"]")
        self.selenium.click("//p[@id=\"more_properties\"]")
        self.assertEqual("002", self.selenium.get_value("//input[@id=\"version\"]"))
        self.assertEqual("pt-br", self.selenium.get_value("//input[@id=\"language\"]"))
        self.assertEqual("My Subject", self.selenium.get_value("//textarea[@id=\"keyword_list\"]"))
        self.assertEqual("Document Shared", self.selenium.get_value("//input[@id=\"name\"]"))
        self.selenium.click("//a[@id=\"share_document\"]")
        self.selenium.wait_for_page_to_load("30000")
        self.assertEqual("Shared", self.selenium.get_text("//a[@name=\"document_state\"]"))
        document_url = self.selenium.get_text("//span[@id=\"sharing_url\"]")
        self.wait_for_activities()
        self.selenium.open("")
        self.selenium.wait_for_page_to_load("30000")
        self.selenium.wait_for_condition("selenium.isElementPresent(\"//button[@value='ung_domain/shared.0']\")", "30000")
        self.selenium.click("//button[@value='ung_domain/shared.0']")
        self.selenium.wait_for_page_to_load("30000")
        self.failIf(self.selenium.is_text_present("No Result"))
        self.selenium.wait_for_condition("selenium.isElementPresent(\"//button[@class='tree-open']\")", "30000")
        self.assertEqual("Shared by me", self.selenium.get_text("//button[@class='tree-open']"))
        self.selenium.open("WebSite_logout")
        self.selenium.wait_for_page_to_load("30000")
        #XXX user already created
#        self.selenium.click("//td[@id=\"new-account-form\"]")
#        self.selenium.type("//input[@name=\"firstname\"]", "Another")
#        self.selenium.type("//input[@name=\"lastname\"]", "User")
#        self.selenium.type("//input[@name=\"email\"]", "example2@example.com")
#        self.selenium.type("//input[@name=\"login_name\"]", "ung_user2")
#        self.selenium.type("//input[@name=\"password\"]", "1234")
#        self.selenium.type("//input[@name=\"confirm\"]", "1234")
#        self.selenium.click("//input[@value=\"Create Account\"]")
#        self.selenium.wait_for_page_to_load("30000")
        self.selenium.type("__ac_name", "ung_user2")
        self.selenium.type("__ac_password", "1234")
        self.selenium.click("//input[@value='Login']")
        self.selenium.wait_for_page_to_load("30000")
        self.selenium.open(document_url)
        self.selenium.wait_for_page_to_load("30000")
        self.assertEqual("Document Shared", self.selenium.get_text("//a[@name=\"document_title\"]"))
        self.selenium.click("//a[@name=\"document_title\"]")
        self.selenium.click("//p[@id=\"more_properties\"]")
        self.assertEqual("002", self.selenium.get_value("//input[@id=\"version\"]"))
        self.assertEqual("pt-br", self.selenium.get_value("//input[@id=\"language\"]"))
        self.assertEqual("My Subject", self.selenium.get_value("//textarea[@id=\"keyword_list\"]"))
        self.selenium.click("//div[@class=\"ui-dialog-buttonset\"]/button[1]")
        self.selenium.wait_for_page_to_load("30000")
        self.rename_document(name='Document Shared Updated', version='003')
        self.selenium.open("WebSite_logout")
        self.selenium.wait_for_page_to_load("30000")
        self.login_as_default_user()
        self.selenium.wait_for_condition("selenium.isElementPresent(\"//table[@class='listbox listbox listbox-table']\")", "30000")
        self.selenium.click("//table[@class='listbox listbox listbox-table']/tbody/tr/td[3]/a")
        self.selenium.wait_for_page_to_load("30000")
        self.selenium.click("//a[@name=\"document_title\"]")
        self.selenium.click("//p[@id=\"more_properties\"]")
        self.assertEqual("Document Shared Updated", self.selenium.get_value("//input[@id=\"name\"]"))
        self.assertEqual("003", self.selenium.get_value("//input[@id=\"version\"]"))
        self.assertEqual("pt-br", self.selenium.get_value("//input[@id=\"language\"]"))
        self.assertEqual("My Subject", self.selenium.get_value("//textarea[@id=\"keyword_list\"]"))
        self.selenium.click("//div[@class=\"ui-dialog-buttonset\"]/button[1]")
        self.selenium.wait_for_page_to_load("30000")
        self.rename_document(version='004')
        self.selenium.click("//a[@name=\"document_title\"]")
        self.selenium.click("//p[@id=\"more_properties\"]")
        self.assertEqual("004", self.selenium.get_value("//input[@id=\"version\"]"))
        #XXX this test delete all documents here
        # but it won't be done

if __name__ == "__main__":
    unittest.main()
