const Company = require('../models/Company');
const User = require('../models/User');

// ADMIN: Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    // Map over companies and fetch the latest name from the User profile
    const companiesWithUpdatedNames = await Promise.all(companies.map(async (c) => {
      const user = await User.findOne({ email: c.email });
      return {
        ...c.toObject(),
        // Use the User's updated fullName, or fallback to the original contactPerson
        contactPerson: user ? user.fullName : c.contactPerson
      };
    }));

    return res.status(200).json({
      success: true,
      companies: companiesWithUpdatedNames
    });
  } catch (error) {
    console.error('Get companies error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch companies.'
    });
  }
};

// ADMIN: Approve a company request
exports.approveCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    // Find the supervisor account registered with this company email.
    const supervisor = await User.findOne({
      email: company.email,
      role: 'staff'
    });

    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Supervisor account not found for this company.'
      });
    }

    // Link the supervisor to the actual Company document.
    supervisor.companyId = company._id;
    supervisor.company = company.name;
    supervisor.isActive = true;

    await supervisor.save();

    company.status = 'Approved';
    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company approved and supervisor activated successfully.',
      company
    });
  } catch (error) {
    console.error('Approve company error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to approve company.'
    });
  }
};

// ADMIN: Reject a company request
exports.rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.'
      });
    }

    company.status = 'Rejected';
    await company.save();

    // Prevent the supervisor from logging in.
    await User.findOneAndUpdate(
      {
        email: company.email,
        role: 'staff'
      },
      {
        $set: {
          isActive: false
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Company rejected and supervisor account deactivated.'
    });
  } catch (error) {
    console.error('Reject company error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to reject company.'
    });
  }
};