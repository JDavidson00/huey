class QueryUi {
  
  #id = undefined;
  #queryModel = undefined;
  #filterDialog = filterDialog;
  #queryAxisTemplateId = undefined;
  #queryAxisItemTemplateId = undefined;
  
  
  constructor(config){
    this.#id = config.id || 'queryUi';
    this.#queryModel = config.queryModel; 
    this.#filterDialog = config.filterDialog;
    this.#queryAxisTemplateId = config.queryAxisTemplateId || 'queryUiAxis';
    this.#queryAxisItemTemplateId = config.queryAxisItemTemplateId || 'queryUiAxisItem';
    this.#renderAxes();
    this.#initEvents();
  }
  
  #queryUiClickHandler(event){
    var target = event.target;
    if (target.tagName !== 'BUTTON'){
      return;
    }
    var node = target;
    var axis, queryAxisItemUi;
    var isClearAxisAction, isPrimaryAxisAction, isAxisItemAction;
    var dom = this.getDom();
    while (node && node !== dom){
      switch (node.tagName){
        case 'SECTION':
          axis = node;
          break;
        case 'LI':
          queryAxisItemUi = node;
          break;
      }
      node = node.parentNode;
    }
    
    if (!axis){
      return;
    }
    
    var targetId = target.getAttribute('id');
    if (targetId.endsWith('-axis-primary-action')) {
      this.#axisPrimaryActionButtonClicked(axis);
    }
    else
    if (targetId.endsWith('-clear-axis')){
      this.#axisClearButtonClicked(axis);
    }
    
    if (!queryAxisItemUi){
      return;
    }
    
    if (targetId.endsWith('-move-left')) {
      this.#queryAxisUiItemMoveLeftClicked(queryAxisItemUi);
    }
    else
    if (targetId.endsWith('-move-right')) {
      this.#queryAxisUiItemMoveRightClicked(queryAxisItemUi);
    }
    else
    if (targetId.endsWith('-remove-from-axis')){
      this.#queryAxisUiItemRemoveClicked(queryAxisItemUi);
    }
    else
    if (targetId.endsWith('-move-to-other-axis')){
      this.#queryAxisUiItemMoveToAxisClicked(queryAxisItemUi);      
    }
    else 
    if (targetId.endsWith('-edit-filter-condition')){
      this.#openFilterDialogForQueryAxisItemUi(queryAxisItemUi);
    }
  }
  
  #openFilterDialogForQueryAxisItemUi(queryAxisItemUi){
    var queryModelItem = this.#getQueryModelItem(queryAxisItemUi);
    this.#filterDialog.openFilterDialog(this.#queryModel, queryModelItem, queryAxisItemUi);
  }
  
  openFilterDialogForQueryModelItem(queryModelItem){
    var queryAxisItemUi = this.#getQueryAxisItemUi(queryModelItem);
    this.#filterDialog.openFilterDialog(this.#queryModel, queryModelItem, queryAxisItemUi);
  }

  #queryAxisUiItemMoveToAxisClicked(queryAxisItemUi){
    var queryModelItem = this.#getQueryModelItem(queryAxisItemUi);
    delete queryModelItem.index;
    switch (queryModelItem.axis) {
      case QueryModel.AXIS_COLUMNS:
        queryModelItem.axis = QueryModel.AXIS_ROWS;
        break;
      case QueryModel.AXIS_ROWS:
        queryModelItem.axis = QueryModel.AXIS_COLUMNS;
        break;
    }
    this.#queryModel.addItem(queryModelItem);
  }

  #moveQueryAxisItemUi(queryAxisItemUi, direction) {
    var queryModelItem = this.#getQueryModelItem(queryAxisItemUi);
    var itemIndex = queryModelItem.index;
    itemIndex += direction;
    queryModelItem.index = itemIndex;
    this.#queryModel.addItem(queryModelItem);
  }

  #queryAxisUiItemMoveLeftClicked(queryAxisItemUi){
    this.#moveQueryAxisItemUi(queryAxisItemUi, -1);
  }

  #queryAxisUiItemMoveRightClicked(queryAxisItemUi){
    this.#moveQueryAxisItemUi(queryAxisItemUi, 1);
  }

  #queryAxisUiItemRemoveClicked(queryAxisItemUi){
    var queryModelItem = this.#getQueryModelItem(queryAxisItemUi);
    queryModel.removeItem(queryModelItem);
  }

  #updateQueryUi(){
    var dom = this.getDom();
    dom.setAttribute('data-cellheadersaxis', this.#queryModel.getCellHeadersAxis());
    var axes = dom.childNodes;
    for (var i = 0; i < axes.length; i++){
      var axis = axes.item(i);
      if (axis.nodeType !== 1 || axis.tagName !== 'SECTION') {
        continue;
      }
      var axisId = axis.getAttribute('data-axis');
      var queryModelAxis = queryModel.getQueryAxis(axisId);
      this.#updateQueryAxisUi(axis, queryModelAxis);
    }
  }
  
  #getQueryAxisItemUiCaption(axisItem){
    return axisItem.columnName;
  }
  
  #getQueryModelItem(queryAxisItemUi){
    var searchItem = {
      columnName: queryAxisItemUi.getAttribute('data-column_name'),
      derivation: queryAxisItemUi.getAttribute('data-derivation'),
      aggregator: queryAxisItemUi.getAttribute('data-aggregator')
    };
    
    var axisUi = queryAxisItemUi.parentNode.parentNode;
    var axisId = axisUi.getAttribute('data-axis');
    if (axisId === QueryModel.AXIS_FILTERS){
      searchItem.axis = axisId; 
    }

    var item = this.#queryModel.findItem(searchItem);
    if (!item) {
      throw new Error(`Unexpected error: could not find item ${JSON.stringify(searchItem)} in query model`);
    }
    return item;
  }
  
  #getQueryAxisItemUi(queryModelAxisItem){
    var axisId = queryModelAxisItem.axis;
    var cssSelector = `#${this.#id}-${axisId} > ol > li[data-column_name="${queryModelAxisItem.columnName}"]`;
    if (queryModelAxisItem.derivation){
      cssSelector += `[data-derivation="${queryModelAxisItem.derivation}"]`;
    }
    if (queryModelAxisItem.aggregator){
      cssSelector += `[data-aggregator="${queryModelAxisItem.aggregator}"]`;
    }
    return document.querySelector(cssSelector);
  }
  
  #createQueryAxisItemUi(axisItem){
    
    var axisId = axisItem.axis;
    
    var id = this.#id 
    if (axisId === QueryModel.AXIS_FILTERS) {
      id += '-' + axisId;
    }
    id += '-' + QueryAxisItem.getIdForQueryAxisItem(axisItem);
    
    var itemUi = this.#instantiateTemplate('queryUiAxisItem', id);
    
    if (axisId === QueryModel.AXIS_FILTERS) {
      var text = 'Click to open the filter dialog to edit the filter.';
      var actionButton = itemUi.getElementsByTagName('BUTTON').item(1);
      actionButton.innerHTML = text;
      var updatedId = id + '--edit-filter-condition';
      actionButton.setAttribute('id', updatedId);
      var label = actionButton.parentNode;
      label.setAttribute('for', updatedId);
      label.setAttribute('title', text);
    }
    
    itemUi.setAttribute('data-column_name',  axisItem.columnName);

    var derivation = axisItem.derivation;
    if (derivation) {
      itemUi.setAttribute('data-derivation', derivation);
    }
    
    var aggregator = axisItem.aggregator;
    if (aggregator) {
      itemUi.setAttribute('data-aggregator', aggregator);
    }
    
    var captionText = this.#getQueryAxisItemUiCaption(axisItem);
    var captionUi = itemUi.getElementsByTagName('span').item(0);
    captionUi.innerText = captionText;

    return itemUi;
  }
  
  #updateQueryAxisUi(axisUi, queryModelAxis) {
    var axisItemsUi = axisUi.getElementsByTagName('ol').item(0);
    axisItemsUi.innerHTML = '';
    var items = queryModelAxis.getItems();
    for (var i = 0; i < items.length; i++){
      var item = items[i];
      var queryAxisItemUi = this.#createQueryAxisItemUi(item);
      axisItemsUi.appendChild(queryAxisItemUi);
    }
  }
  
  #queryModelChangeHandler(event) {
    var eventData = event.eventData;
    // TODO: examine the event Data and figure out if we have to update the entire ui or just bits of it.
    this.#updateQueryUi();
    
    if (eventData.propertiesChanged) {
      if (eventData.propertiesChanged.datasource) {
        var display;
        if (eventData.propertiesChanged.datasource.newValue) {
          display = '';
        }
        else {
          display = 'none';
        }
        this.getDom().style.display = display;
      }
    }
  }
  
  #initEvents(){
    var dom = this.getDom();
    dom.addEventListener('click', this.#queryUiClickHandler.bind(this));

    this.#queryModel.addEventListener('change', this.#queryModelChangeHandler.bind(this));
  }
  
  #axisClearButtonClicked(axis){
    var axisId = axis.getAttribute('data-axis');
    this.#queryModel.clear(axisId);
  }

  #axisPrimaryActionButtonClicked(axis){
    var axisId = axis.getAttribute('data-axis');
    switch (axisId){
      case QueryModel.AXIS_COLUMNS:
      case QueryModel.AXIS_ROWS:
        this.#queryModel.flipAxes(QueryModel.AXIS_COLUMNS, QueryModel.AXIS_ROWS);
        break;
      case QueryModel.AXIS_CELLS:
        var cellheadersaxis = this.#queryModel.getCellHeadersAxis();
        switch (cellheadersaxis) {
          case QueryModel.AXIS_COLUMNS:
            cellheadersaxis = QueryModel.AXIS_ROWS;
            break;
          case QueryModel.AXIS_ROWS:
            cellheadersaxis = QueryModel.AXIS_COLUMNS;
            break;
          default:
            throw new Error(`Unrecognized cellaxisplacement ${cellheadersaxis}`);
        }
        this.#queryModel.setCellHeadersAxis(cellheadersaxis);
        break;
    }
  }
    
  #instantiateTemplate(templateId, instanceId) {
    var template = byId(templateId);
    var clone = template.content.cloneNode(true);
    var index = 0;
    var node;
    do {
      var node = clone.childNodes.item(index++);
    } while (node && node.nodeType !== node.ELEMENT_NODE);
    node.setAttribute('id', instanceId);
    
    //
    var buttons = node.getElementsByTagName('button');
    for (var i = 0; i < buttons.length; i++){
      var button = buttons.item(i);
      var buttonId = instanceId + '-' + button.getAttribute('id');
      button.setAttribute('id', buttonId);
      button.parentNode.setAttribute('for', buttonId);
    }
    return node;
  }
  
  #getCellsAxisPrimaryActionTitle(){
    var cellsAxisPrimaryActionTitle;
    var targetAxis;
    var cellHeadersAxis = this.#queryModel.getCellHeadersAxis();
    switch (cellHeadersAxis){
      case QueryModel.AXIS_COLUMNS:
        targetAxis = QueryModel.AXIS_ROWS;
        break;
      case QueryModel.AXIS_ROWS:
        targetAxis = QueryModel.AXIS_COLUMNS;
        break;
    }
    var cellsAxisPrimaryActionTitle = `Move the cell headers to the ${targetAxis} axis`;
    return cellsAxisPrimaryActionTitle;
  }
  
  #renderAxis(config){
    var axisId = config.axisId;
    var caption = config.caption || (axisId.charAt(0).toUpperCase() + axisId.substr(1));
    var axis = this.#instantiateTemplate(this.#queryAxisTemplateId, this.#id + '-' + axisId);

    var primaryAxisActionLabelTitle;
    if (config.primaryAxisActionLabelTitle){
      primaryAxisActionLabelTitle = config.primaryAxisActionLabelTitle;
    }
    else {
      switch (axisId) {
        case QueryModel.AXIS_FILTERS:
          primaryAxisActionLabelTitle = '...';
          break;
        case QueryModel.AXIS_COLUMNS:
        case QueryModel.AXIS_ROWS:
          primaryAxisActionLabelTitle = 'Flip the rows and columns axes';
          break;
        case QueryModel.AXIS_CELLS:
          primaryAxisActionLabelTitle = this.#getCellsAxisPrimaryActionTitle();
          break;
      }
    }
    var labels = axis.getElementsByTagName('label');
    
    var primaryAxisActionLabel = labels.item(0);
    primaryAxisActionLabel.setAttribute('title', primaryAxisActionLabelTitle);
    
    labels.item(1).setAttribute('title', `Clear all items from the ${axisId} axis.`);
    
    axis.setAttribute('data-axis', axisId);
    var heading = axis.getElementsByTagName('h1').item(0);
    heading.innerText = caption;
    this.getDom().appendChild(axis);
  }
  
  #renderAxes(){
    this.#renderAxis({
      axisId: QueryModel.AXIS_FILTERS
    });
    this.#renderAxis({
      axisId: QueryModel.AXIS_COLUMNS
    });
    this.#renderAxis({
      axisId: QueryModel.AXIS_ROWS
    });
    this.#renderAxis({
      axisId: QueryModel.AXIS_CELLS
    });    
  }
  
  getDom(){
    return byId(this.#id);
  }
}

var queryUi;
function initQueryUi(){
  queryUi = new QueryUi({
    id: 'queryUi',
    queryModel: queryModel,
    filterDialog: filterDialog
  });
}
