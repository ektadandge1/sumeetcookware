import {FIGMA_ASSETS} from './homeAssets';

const QUANTITIES = ['10 - 49', '50 - 99', '100 - 249', '250 - 499', '500+'];

const STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export function HomeBusinessBuyers() {
  return (
    <section
      id="business-enquiry"
      className="home-business"
      aria-labelledby="business-title"
      style={{
        backgroundImage: `url("${FIGMA_ASSETS.businessBackground}")`,
      }}
    >
      <div className="home-business-inner">
        <div className="home-business-copy">
          <h2 id="business-title">For Business Buyers</h2>
          <p>
            Fill In The Details To Get An Exclusive Discount
            <br />
            On Your Bulk Order!
          </p>
          <small>When GST Benefits</small>
        </div>

        <div className="home-business-form-panel">
          <span className="home-business-form-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" focusable="false">
              <path d="M13 5h17l8 8v25a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z" />
              <path d="M29 5v9h9M16 21h14M16 28h14M16 35h9" />
              <path d="M4 17v22a5 5 0 0 0 5 5h20" />
            </svg>
          </span>

          <form
            acceptCharset="UTF-8"
            action="https://sumeetcookware.in/contact"
            className="home-business-form"
            data-shopify-captcha="true"
            id="BusinessEnquiryForm"
            method="post"
          >
            <input name="form_type" type="hidden" value="contact" />
            <input name="utf8" type="hidden" value="✓" />
            <input
              name="contact[Inquiry type]"
              type="hidden"
              value="Business bulk enquiry"
            />

            <label htmlFor="BusinessEnquiryCompany">
              Company Name
              <input
                autoComplete="organization"
                id="BusinessEnquiryCompany"
                name="contact[Company name]"
                placeholder="Enter your company name"
                required
              />
            </label>

            <label htmlFor="BusinessEnquiryName">
              Your Name
              <input
                autoComplete="name"
                id="BusinessEnquiryName"
                name="contact[Name]"
                placeholder="Enter your name"
                required
              />
            </label>

            <label htmlFor="BusinessEnquiryEmail">
              Business Email
              <input
                autoComplete="email"
                id="BusinessEnquiryEmail"
                name="contact[email]"
                placeholder="name@company.com"
                required
                type="email"
              />
            </label>

            <div className="home-business-form-row">
              <label htmlFor="BusinessEnquiryPhone">
                Phone Number
                <input
                  autoComplete="tel"
                  id="BusinessEnquiryPhone"
                  inputMode="tel"
                  name="contact[Phone number]"
                  placeholder="+91 0000000000"
                  required
                  type="tel"
                />
              </label>

              <label htmlFor="BusinessEnquiryQuantity">
                Select Quantity
                <select
                  defaultValue=""
                  id="BusinessEnquiryQuantity"
                  name="contact[Quantity]"
                  required
                >
                  <option disabled value="">
                    Select
                  </option>
                  {QUANTITIES.map((quantity) => (
                    <option key={quantity} value={quantity}>
                      {quantity}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label htmlFor="BusinessEnquiryState">
              State
              <select
                autoComplete="address-level1"
                defaultValue=""
                id="BusinessEnquiryState"
                name="contact[State]"
                required
              >
                <option disabled value="">
                  Select State
                </option>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="BusinessEnquiryBody">
              Tell Us Your Specific Requirement
              <textarea
                id="BusinessEnquiryBody"
                name="contact[body]"
                required
                rows={5}
              />
            </label>

            <button type="submit">
              Submit <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
