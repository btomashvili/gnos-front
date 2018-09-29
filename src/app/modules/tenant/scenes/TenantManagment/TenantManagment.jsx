/* eslint import/no-extraneous-dependencies:0 */
/* eslint class-methods-use-this:0 */
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link, browserHistory } from 'react-router'
import moment from 'moment'
import SweetAlert from 'sweetalert-react'
import 'sweetalert/dist/sweetalert.css'
import { Input } from '../../../../components/Input/Input'
import './TenantManagment.scss'

import {
  leaseListRequest,
  updateFieldValue,
  deleteTenantRequest,
  tenantSearchSuccess,
  inProgressTenantRequest,
} from '../../actions/tenantActions'

import {
  propertyListRequest,
  transferPropertyRequest,
  offerListRequest,
  confirmOfferRequest,
} from '../../../property/actions/propertyActions'

import { updateFieldValue as updateCurrentUserFieldValue }
from '../../../currentUser/actions/currentUserActions'

import { injectNOS } from '@nosplatform/api-functions/lib/react'

import deleteConfirmIcon from '../../../../resources/assets/images/icons/delete-confirm.svg'
import { showMessageBox } from '../../../../components/helpers/messageBox'

class TenantManagment extends Component {
  constructor(props) {
    super(props)
    this.showSellModal = this.showSellModal.bind(this)
    this.state = {
      show: false,
      isBodyVisible: false,
      cards: {},
      previousCard: null,
      isSellModalVisible: false,
      activeTab: 'properties',
      order: {
        property: {},
        to: 'AK2nJJpJr6o664CWJKi1QRXjqeic2zRp8y',
        amount: 50,
      },
    }
  }

  componentDidMount() {
    this.props.nos.getAddress()
      .then((walletAddress) => {
        this.runQuery(this.props)
      })
  }

  componentWillReceiveProps(nextProps) {
    if (
      (nextProps.location && nextProps.location !== this.props.location) ||
      (this.props.reloadData !== nextProps.reloadData && nextProps.reloadData)
    ) {
      this.runQuery(nextProps)
    }
  }

  filterQuery() {
    const where = {}
    this.props.updateFieldValue('query.where', where)
  }

  runQuery = (props) => {
    this.filterQuery(props)
    const { walletAddress } = this.props
    setTimeout(() => {
      const query = this.props.query.toJS()
      query.where = {
        owner: walletAddress,
      }
      query.populate = ['order']
      this.props.dispatch(propertyListRequest(query))

      const offerQuery = {
        where: { to: walletAddress },
        populate: ['propertyId'],
      }
      this.props.dispatch(offerListRequest(offerQuery))
    }, 30)
  }

  showSellModal(item) {
    console.log('reset')
    this.setState({ isSellModalVisible: true, order: { property: item.toJS() } })
  }
  closeSellModal(item) {
    this.setState({ isSellModalVisible: false })
  }

  confirmOrder(offer) {
    showMessageBox({
      text: 'Are you sure you want to buy this property?',
      icon: deleteConfirmIcon,
      confirmCallback: () => {
        const data = offer.toJS()
        this.props.dispatch(confirmOfferRequest(data))
      },
    })
  }

  handleSearch(e) {
    // console.log(e.target.value)
    this.props.searchTenantRequest(e.target.value)
  }

  invokeContract() {
    // alert('invoke')
    const nos = window.NOS.V1

    // const scriptHash = '2f228c37687d474d0a65d7d82d4ebf8a24a3fcbc'
    const scriptHash = '5f47e23a39368551b1b66047aad0f3f843fea89e'
    // const scriptHash = '4b7f81954214a90b54d56e12f42cb9ac46de020a'
    const operation = 'nika'
    const args = ['ef68bcda-2892-491a-a7e6-9c4cb1a11732']

    // nos.invoke({ scriptHash, operation, args })
    // .then((script) => {
    //   // alert(`Test invoke script: ${script} `)
    //   console.log('script', script)
    // }) 
    // .catch((err) => {
    //   alert(`Error: ${err.message}`)
    //   console.log('error', err)
    // })

    nos.testInvoke({ scriptHash, operation, args })
    .then((script) => {
      // alert(`Test invoke script: ${script} `)
      console.log('script', script)
    })
    .catch((err) => {
      alert(`Error: ${err.message}`)
      console.log('error', err)
    })

    // const credits = this.props.currentUser.get('credits')
    // console.log('CREDITS : ', credits)
    // if (credits < 1) {
    //   this.setState({ show: true })
    // } else {
    //   browserHistory.push('/tenants/new')
    // }
  }


  generateAddressForReport(tenant) {
    return `${tenant.getIn(['property', 'street'])}-${tenant.getIn(['property', 'city'])}-${tenant.getIn([
      'property',
      'state',
    ])}-${tenant.getIn(['property', 'zip'])}`
  }

  renderStatus = (tenant) => {
    if (tenant.get('status') && tenant.get('status').toLowerCase() === 'active') {
      return <button className="btn btn-sm btn-success">Active </button>
    }

    return <button className="btn btn-sm btn-primary">Under mortgage</button>
  }

  updateOrderDetails(fieldName) {
    return (e) => {
      const { order } = this.state
      order[fieldName] = e.target.value
      console.log(order)
      this.setState({ order })
    }
  }

  transfer() {
    const { order } = this.state
    const { dispatch } = this.props
    this.closeSellModal()
    dispatch(transferPropertyRequest(order))
  }

  renderBody(item) {
    console.log(this.state.cards, item.get('_id'), this.state.cards[item.get('_id')])
    if (!this.state.cards[item.get('_id')]) {
      return null
    }

    return (
      <div className="card-body">
        <ul className="list-group">
          <li className="list-group-item">
            <span className="data-label">Status:</span>
            {this.renderStatus(item)}
          </li>


          <li className="list-group-item">
            <span className="data-label">number:</span>
            {item.get('number')}
          </li>
          <li className="list-group-item">
            <span className="data-label">title:</span>
            {item.get('title')}
          </li>
          <li className="list-group-item">
            <span className="data-label">cadastral code:</span>
            {item.get('cadastral')}
          </li>
          <li className="list-group-item">
            <span className="data-label">MAP Address:</span>
            <a href={`https://www.google.com/maps/?q=${item.get('mapAddress')}`} target="_blank" >View on Google map</a>
          </li>
          <li className="list-group-item">
            <span className="data-label">Registration Date:</span>
            {moment(item.get('registrationDate')).format('DD-MMMM-YYYY')}
          </li>
          <li className="list-group-item">
            <span className="data-label">type:</span>
            {item.get('type')}
          </li>
          <li className="list-group-item">
            <span className="data-label">address:</span>
            {item.get('address')}
          </li>
          <li className="list-group-item">
            <span className="data-label">area:</span>
            {item.get('area')} m<sup>2</sup>
          </li>
          <li className="list-group-item">
            <span className="data-label">link:</span>
            {item.get('link')}
          </li>
          <li className="list-group-item">
            <span className="data-label">owner (Wallet Address):</span>
            {item.get('owner')}
          </li>

          {/*
          <li className="list-group-item">
            <span className="data-label in-progress">For Sale:</span>
            <input
              type="checkbox"
              id="inProgress"
              onChange={() => this.handleCheckBox(item)}
              checked={item.get('status') === 'submited'}
            />
            <label className={`switch ${!item.get('isAutoSubmited')}`} htmlFor="inProgress">
              Toggle
            </label>
          </li>
          <li className="list-group-item">
            <span className="data-label">Price:</span>
            <input type="number" min="0" step={1000} /> $ (USD)
          </li>
          <li className="list-group-item">
            <span className="data-label">Address:</span>
            <input type="text" value={`${this.generateAddressForReport(item)}`} />
          </li>
          */}

        </ul>
      </div>
    )
  }

  renderSellModal() {
    const { isSellModalVisible, order: { amount, to } } = this.state

    if (!isSellModalVisible) {
      return null
    }

    return (
      <div className="modal-bg" >
        <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Transfer property</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-group">
                    <label>Wallet Address</label>
                    <input type="text" className="form-control" onChange={this.updateOrderDetails('to').bind(this)} value={to} placeholder="Wallet Address" />
                    <span style={{ marginTop: 5, marginLeft: 5, fontSize: 12 }} >
                    ex: AK2nJJpJr6o664CWJKi1QRXjqeic2zRp8y</span>
                  </div>
                  <div className="form-group">
                    <label>Amount (NEO)</label>
                    <input type="number" className="form-control" onChange={this.updateOrderDetails('amount').bind(this)} value={amount} placeholder="Enter amount..." />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={this.closeSellModal.bind(this)} data-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary" onClick={this.transfer.bind(this)} >Sell</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderProperties() {
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <div className="float-left">
              <h3>Properties</h3>
            </div>

            <div className="float-right">
              {/* <button className="btn btn-danger btn-icon" type="button" onClick={() => this.invokeContract()}>
                <i className="fa fa-plus" aria-hidden="true" /> Test Invoke
              </button> */}
            </div>
          </div>
          <div className="col-md-6">
            <Input
              className="form-control"
              value={this.props.searchText}
              placeholder="Search..."
              onChange={(value) => {
                this.handleSearch(value)
              }}
              type="text"
            />
          </div>
          <br />
          <div className="col-md-12">
            <hr />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            {this.props.items.valueSeq().map((tenant, key) => (
              <div key={key}>
                <div className="card">
                  <div className="card-header">
                    <div
                      className="float-left"
                      onClick={() => {
                        const { cards } = this.state
                        cards[tenant.get('_id')] = !cards[tenant.get('_id')]
                    // cards[tenant.get('_id')] = true

                        console.log(tenant.get('_id'))

                        if (Object.keys(cards).length > 1) {
                          cards[this.state.previousCard] = false // hide previous card
                        }

                        this.setState({ cards, previousCard: tenant.get('_id') })
                      }}
                    >
                      <h4>
                        <i className="fa fa-home" /> &nbsp;
                        <span>{tenant.get('address')} </span>
                      </h4>
                    </div>
                    <div className="float-right">
                      <Link to={`#`} className="btn btn-icon btn-sm btn-default report-btn">
                         <i className="fa fa-file-text" aria-hidden="true" />
                         Transaction history
                      </Link>  
                      <button
                        onClick={() => this.showSellModal(tenant)}
                        className={'btn btn-icon btn-sm btn-primary'}
                      >
                        <i className="fa fa-file-text" aria-hidden="true" />
                      Sell
                    </button>

                    </div>
                  </div>
                  {this.renderBody(tenant)}
                </div>
                <br />
              </div>
          ))}
          </div>
        </div>
      </div>
    )
  }

  renderOffers() {
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <div className="float-left">
              <h3>Offers</h3>
            </div>

            <div className="float-right" />
          </div>
          <div className="col-md-6">
            <Input
              className="form-control"
              value={this.props.searchText}
              placeholder="Search..."
              onChange={(value) => {
                this.handleSearch(value)
              }}
              type="text"
            />
          </div>
          <br />
          <div className="col-md-12">
            <hr />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            {this.props.offers.valueSeq().map((offer, key) => (
              <div key={key}>
                <div className="card">
                  <div className="card-header">
                    <div
                      className="float-left"
                      onClick={() => {
                        const { cards } = this.state
                        const id = offer.getIn(['propertyId', '_id'])
                        cards[id] = !cards[id]
                    // cards[id] = true

                        console.log(id)

                        if (Object.keys(cards).length > 1) {
                          cards[this.state.previousCard] = false // hide previous card
                        }

                        this.setState({ cards, previousCard: id })
                      }}
                    >
                      <h4>
                        <i className="fa fa-home" /> &nbsp;
                        <span>{offer.getIn(['propertyId', 'address'])} </span>
                      </h4>
                    </div>
                    <div className="float-right">

                      {offer.get('status') === 'inprogress' && (
                      <button
                        onClick={() => this.confirmOrder(offer)}
                        className={'btn btn-icon btn-sm btn-success'}
                      >
                        <i className="fa fa-file-text" aria-hidden="true" />
                        Confirm
                      </button>
                    )}

                    </div>
                  </div>
                  {this.renderBody(offer.get('propertyId'))}
                </div>
                <br />
              </div>
          ))}
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { activeTab } = this.state
    return (
      <div className="tenants-page">
        <SweetAlert
          show={this.state.show}
          title="No Remaining WalkThrus"
          html
          text="Please contact us to have more WalkThrus added to your account"
          onConfirm={() => this.setState({ show: false })}
        />

        <nav>
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <a className={`nav-item nav-link ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => this.setState({ activeTab: 'properties' })}>Properties</a>
            <a className={`nav-item nav-link ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => this.setState({ activeTab: 'offers' })}>Offers</a>
          </div>
        </nav>


        <div className="tab-content" id="nav-tabContent">
          {activeTab === 'properties' && (
            <div className="tab-pane fade show active">
              {this.renderProperties()}
            </div>
          )}
          {activeTab === 'offers' && (
            <div className="tab-pane fade show active">
              {this.renderOffers()}
            </div>
          )}
        </div>

        {this.renderSellModal()}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    currentUserRole: state.currentUser.getIn(['data', 'role']),
    currentUser: state.currentUser.get('data'),
    reloadData: state.property.get('reloadData'),
    isLoading: state.tenant.get('isLoading'),
    query: state.tenant.get('query'),
    pageSize: state.tenant.getIn(['query', 'pageSize']),
    currentPage: state.tenant.getIn(['query', 'page']),
    totalCount: state.tenant.get('totalCount'),
    items: state.property.get('items'),
    offers: state.property.get('offers'),
    searchText: state.tenant.get('searchText'),
    defaultNumberOfDaysToComplete: state.currentUser.getIn(['data', 'defaultNumberOfDaysToComplete']),
    walletAddress: state.currentUser.get('walletAddress'),
  }
}

const mapDispatchToProps = dispatch => ({
  dispatch,
  leaseListRequest: query => dispatch(leaseListRequest(query)),
  deleteTenantRequest: (id, lease) => dispatch(deleteTenantRequest(id, lease)),
  searchTenantRequest: text => dispatch(tenantSearchSuccess(text)),
  updateFieldValue: (field, value, parent, isDelete) => dispatch(updateFieldValue(field, value, parent, isDelete)),
  inProgressRequest: (id, lease) => dispatch(inProgressTenantRequest(id, lease)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectNOS(TenantManagment))
