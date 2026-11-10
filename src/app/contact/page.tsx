import { ContactForm } from "@/components/ContactForm";
import { Page } from "@/components/Page";
import { contact } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata(contact.title, contact.description, "/contact/");

export default function ContactPage() {
  return (
    <Page title={contact.title} transitionName="title-contact">
      <ContactForm />
    </Page>
  );
}
