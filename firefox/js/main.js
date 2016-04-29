/**
 * Toggle the visibility of the sidebar
 */
$("#menu-toggle").click(function(e) {
  e.preventDefault();
  $(".wrapper").toggleClass("toggled");
});

/**
 * Generate a nice little output of the classes the user has selected
 * so they can be ready for registration day
 */
function generateClassOutput() {
  $(".unitOverview").html(""); // Clear what was there before

  // Create headings and containers for selected class data
  $(".class_list a").each(function(index) {
    var unitContainer = crel("div", {"id": $(this).text()}, // Unit Container
      crel("h3", $(this).text()), // Unit Heading
      crel("div", {"class": "selected_classes"}) // Class Container
    );
    $(".unitOverview").append(unitContainer);
  });

  // Add the classes into the selected classes section we created before
  $("div[selected]").each(function(index) {
    var classData = $(this).attr("classType") + " " +
                    $(this).attr("day") + " " +
                    $(this).attr("start") + " - " +
                    $(this).attr("end") + " " +
                    $(this).attr("location") + "<br />";

    // Append selected class data to the container with the same unit ID
    var unitID = $(this).parents().eq(2).find("a").text();
    $("#" + unitID + ">.selected_classes").append(classData);
  });
}

/**
 * Set an appropriate max-height for the current class list and show it
 */
function slideDownCurrentList(currentList, allLists) {
  currentList.slideDown();
  var distFromTop = currentList.offset().top - $(window).scrollTop();
  var listsUnderCurrent = allLists.length - currentList.index(".classes") - 1;
  var underOffset = listsUnderCurrent * (currentList.parent().next().height());
  var maxHeight = Math.max($(window).height() - distFromTop - underOffset, 150);
  currentList.css("max-height", maxHeight);
}

/**
 * Handle sidebar height adjustments when the window is resized
 */
$(window).on("resize", function(){
  var currentList = $(".classes:visible");
  if (currentList.length == 1) {
    var allLists = $(".classes");
    slideDownCurrentList(currentList, allLists);
  }
}).resize();

/**
 * Save current units so we don't have to import them every time we refresh
 */
$( window ).unload(function() {
  var data = "";
  $(".class_list").each(function() {
    data += $(this).get(0).outerHTML;
  });
  localStorage.setItem("classLists", data);
});

$(document).ready(function() {
  // Load a hint underneath the calendar
  var tips = [
    "Hover your mouse over a class type in the sidebar to preview all available classes of that type!",
    "Use the dropdown in the search bar to select your campus when searching for classes!",
    "New to QUT? We have 3 campuses: Gardens Point (GP), Kelvin Grove (KG) and Caboolture (CB)!",
    "These tips will show every time you refresh the page. Want to see a new one? Ctrl+R!"
  ];
  var tip = $(".alert").html() + tips[Math.floor(Math.random() * tips.length)];
  $(".alert").html(tip);

  // Initialize the calendar
  var cal = $(".calendar").fullCalendar({
    header: false,
    allDaySlot: false,
    allDayDefault: false,
    defaultView: "agendaWeek",
    minTime: "07:00:00",
    maxTime: "22:00:00",
    height: "auto",
    columnFormat: { week: "ddd" },
    slotEventOverlap: false,
    weekends: false,
    editable: false,
    droppable: false
  });

  // Reload the imported subjects from memory
  var classLists = localStorage.getItem("classLists");
  if (classLists !== null) {
    $(".class_container").append(classLists);
    $(".classes").scrollLock();
  }

  // Add the selected units to the calendar
  $(".class[selected='selected']").each(function() {
    addClass($(this));
  });
  generateClassOutput();

  /**
   * Trigger a search when the user presses the Enter key in the search bar
   */
  $("#unit-search").keyup(function(event) {
    if (event.keyCode == 13) { // Enter
      var baseURL = "https://qutvirtual3.qut.edu.au/qvpublic/ttab_unit_search_p.process_search?";
      var params = {
        p_time_period_id: $("#campus-selector").val()
      };

      // Determine if search is a unit code or unit description
      var searchText = $(this).val().trim();
      var regex = /\b[a-zA-Z]{3}\d{3}\b/; // 3 letters, 3 digits
      if (regex.test(searchText)){
        params.p_unit_cd = searchText;
      } else {
        params.p_unit_description = searchText;
      }

      window.open(baseURL + $.param(params), "_blank");
    }
  });

  /**
   * Show or hide the classes for an imported subject
   */
  $(document).on("click", ".class_list a", function() {
    var currentList = $(this).next(".classes");

    // Determine if the current list is showing
    if (currentList.css("display") == "none") {
      var allLists = $(this).parent().parent().find(".classes");
      var allVisible = $(this).parent().parent().find(".classes:visible");

      // Hide any visible class lists before showing the clicked list
      if (allVisible.length !== 0) {
        allVisible.slideUp(function() {
          slideDownCurrentList(currentList, allLists);
        });
      } else {
        slideDownCurrentList(currentList, allLists);
      }
    } else {
      currentList.slideUp();
    }
  });

  /**
   * Create a unique identifier for classes on the calendar, following the
   * format: unitID_classType_locCampus_locRoom_timeDay_timeStart_timeEnd
   */
  function getClassID(classData) {
    var idData = [
      classData.attr("unitID"),
      classData.attr("classType"),
      classData.attr("location").replace(" ", "_"),
      classData.attr("day"),
      classData.attr("start"),
      classData.attr("end")
    ];
    return idData.join("_");
  }

  /**
   * Create a human-readable description of the class to be used in the calendar
   */
  function getClassText(classData) {
    return classData.attr("unitID") + "\n" +
           classData.attr("classType") + " " +
           classData.attr("location") + "\n\n" +
           classData.attr("unitName");
  }

  /**
   * Add a new class to the calendar
   */
  function addClass(classData) {
    cal.fullCalendar( "renderEvent" , {
      id: getClassID(classData),
      title: getClassText(classData),
      start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
      end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
      className: classData.attr("classType").toLowerCase()
    });
  }

  /**
   * Add a class preview to the calendar
   */
  function previewClass(classData) {
    // Only continue if class is not selected
    if (classData.attr("selected") != "selected") {
      // Add the event details to the calendar
      cal.fullCalendar("renderEvent", {
        id: "preview",
        title: getClassText(classData),
        start: Date.parse(classData.attr("day") + " " + classData.attr("start")),
        end: Date.parse(classData.attr("day") + " " + classData.attr("end")),
        className: "preview " + classData.attr("classType").toLowerCase()
      });
    }
  }

  /**
   * Preview all same-type classes when the user hovers over a class-type heading
   */
  $(document).on("mouseover", ".classes b", function() {
    $(this).nextAll(".class").each(function() {
      previewClass($(this));
    });
  });

  /**
   * Preview a class on the calendar when the user hovers over it in the sidebar
   */
  $(document).on("mouseover", ".class", function(){
    previewClass($(this));
  });

  /**
   * Remove previews once user stops hovering over a class or class-type heading
   */
  $(document).on("mouseout", ".classes", function() {
    cal.fullCalendar("removeEvents", "preview");
  });

  /**
   * Add the class to the calendar when the user clicks on it
   */
  $(document).on("click", ".class", function() {
    // If the class is selected, it is already on the calendar
    if ($(this).attr("selected") != "selected") {
      // Add the class to the calendar
      cal.fullCalendar("removeEvents", "preview");
      addClass($(this));

      // Add the class as selected
      $(this).attr("selected", "true");
      $(this).append(crel("div", {"class": "remove_class"}, "x"));
      generateClassOutput();

      // Track this with GA
       var GAlabel = "["+$(this).attr("classType")+"] " + $(this).attr("day") + " ("+$(this).attr("start")+"-"+$(this).attr("end")+") " + " @ " + $(this).attr("location");
      _gaq.push(["_trackEvent", $(this).attr("unitName"), "enrol", GAlabel]);
    }
  });

  /**
   * Remove a selected class from the calendar and its 'remove_class' button
   */
  $(document).on("click", ".remove_class", function() {
    var classElement = $(this).parent();

    // Only remove that class, nothing else.
    cal.fullCalendar("removeEvents", getClassID(classElement));

    // Remove the class selection
    classElement.removeAttr("selected");
    $(this).remove();
    generateClassOutput();

    // Track this with GA
    var GAlabel = "["+classElement.attr("classType")+"] " + classElement.attr("day") + " ("+classElement.attr("start")+"-"+classElement.attr("end")+") " + " @ " + classElement.attr("location");
    _gaq.push(["_trackEvent", classElement.attr("unitName"), "unenrol", GAlabel]);

    // Since the button is a child of the class div,
    // return so that we don't add the class again
    return false;
  });

  /**
   * Remove a unit from the list of imported units in the sidebar
   */
  $(document).on("click", ".remove_unit", function() {
    var unitHeader = $(this).parent();

    // Remove all classes from this unit
    var subjectCode = unitHeader.find("a").text();
    cal.fullCalendar("removeEvents", function(event) {
      return (event.id.indexOf(subjectCode) > -1);
    });

    // Remove the unit listing
    unitHeader.remove();
    generateClassOutput();

    //Trigger a resize event to resize the sidebar
    $(window).trigger("resize");

    // Track this with GA
    _gaq.push(["_trackEvent", subjectCode, "unenrol", subjectCode]);
  });

});